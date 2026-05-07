import type {
  AiContext,
  AiInput,
} from '@tailor-cms/interfaces/ai.ts';
import type { OpenAI } from 'openai';
import { oneLine, stripIndent } from 'common-tags';
import { schema as schemaConfiguration } from '@tailor-cms/config';

import getContentSchema from '../schemas/index.ts';
import RepositoryContext from './RepositoryContext.ts';

import { ai as aiConfig } from '#config';
import { createAiLogger, formatPrompt } from '../logger.ts';

const logger = createAiLogger('prompt');

// Models that accept the `reasoning.effort` parameter.
// Passing `reasoning` to a non-reasoning model
// is rejected by the API, so gate before adding it to the request.
const REASONING_MODEL_PREFIXES = ['gpt-5', 'o1', 'o3', 'o4'];

export function supportsReasoning(modelId: string | undefined): boolean {
  if (!modelId) return false;
  return REASONING_MODEL_PREFIXES.some((prefix) => modelId.startsWith(prefix));
}

const systemPrompt = stripIndent`
  Assistant helps authors generate content inside the user's repository.
  Rules:
  - Follow the user-provided rules and the schema-defined content rules.
  - Match the tone, voice, and conventions of the repository's medium.
    Most repositories are pedagogical (courses, knowledge bases,
    training materials, references) - lean toward clear instruction,
    progressive complexity, and learner-friendly framing. For other
    media (narrative, editorial, catalog, feed, q&a) honour the
    schema's own outputRules instead of forcing a learning frame.
  - Keep language accessible and avoid offensive content.
`;

// Per-mode shape line. Picked from schema.ai.contentMode and
// folded into the universal authoring rules at request time.
const SHAPE_BY_MODE: Record<string, string> = {
  pedagogical: oneLine`
    Pedagogical content shape. Teach the audience: clear
    explanations, progressive complexity, practical examples, and
    assessment where the host accepts question elements. Mix text,
    media, and checks purposefully.
  `,
  reference: oneLine`
    Reference content shape. Stay terse and scannable: lookup-first,
    lists and tables over walls of prose, no padding, no greeting or
    framing sentences. Bold key terms.
  `,
  editorial: oneLine`
    Editorial content shape. Journalistic / newsletter voice: lead
    with what is interesting, attribute claims, vary sentence rhythm.
    No textbook framing or learning objectives.
  `,
  narrative: oneLine`
    Narrative content shape. Story, scene, dialogue. Visuals are
    artist directions in prose unless an asset is clearly meant to
    be embedded. No learning-objective framing.
  `,
  analytical: oneLine`
    Analytical content shape. Every claim is falsifiable and either
    quotes a source asset, names what it is inferred from, or marks
    itself synthesized. Comparisons render as tables (criteria x
    options), not prose. Risks and costs are itemised with
    probability/impact or numeric estimate + assumptions; never
    buried in narrative. Recommendations name a single option,
    accept tradeoffs explicitly, and preserve dissent.
  `,
};

// Build the universal authoring rules. Mode-specific content shape
// is injected from the schema; the rest applies to every path.
function buildAuthoringRules(contentMode: string): string {
  const shape = SHAPE_BY_MODE[contentMode] || SHAPE_BY_MODE.pedagogical;
  return stripIndent`
    Authoring rules (apply to every element you produce or rewrite):
    - No fixed length unless explicitly requested. Match the medium
      and the brief: a reference entry is terse, a course lesson can
      run hundreds of words, a glossary line is one sentence.
    - Do NOT duplicate metadata inside the element body. When the
      host activity or its parent subcontainer has a title / name /
      heading field, do NOT lead the body with that text as a
      heading or label; the renderer shows meta separately. Do not
      narrate position, sequence number, mood, or layout in prose -
      structure already conveys them.
    - ${shape}
  `;
}

// Read the schema's declared contentMode (defaults to pedagogical).
// Lives at the top-level Schema config; per-container outputRules
// can still override on top of this baseline.
function resolveContentMode(schemaId: string | undefined): string {
  if (!schemaId) return 'pedagogical';
  try {
    const schema = (schemaConfiguration as any).getSchema(schemaId);
    return schema?.ai?.contentMode || 'pedagogical';
  } catch {
    return 'pedagogical';
  }
}

const documentPrompt = stripIndent`
  The user has provided source documents indexed in a vector store.
  Use the file_search tool to find relevant information from these
  documents. Base ALL generated content on information found in the
  documents. Do not invent information not present in the documents.
  If any assets are marked as PRIMARY SOURCE, they represent the
  core knowledge base. Structure and model your content primarily
  after these sources. Supplementary assets provide additional
  context but should not override the core sources.
`;

export class AiPrompt {
  // OpenAI client
  private client: OpenAI;
  // Information about the repository, content location, topic, etc.
  private repositoryContext: RepositoryContext;
  private requestContext: AiContext;
  private inputs: AiInput[];
  private content: string;
  private response: any;

  constructor(client: OpenAI, context: AiContext) {
    if (!context?.inputs?.length) throw new Error('Prompt not provided');
    this.repositoryContext = new RepositoryContext(context.repository);
    this.content = context.content || '';
    this.inputs = context.inputs;
    this.client = client;
    this.requestContext = context;
  }

  get vectorStoreId() {
    return this.repositoryContext.vectorStoreId;
  }

  get context(): AiContext {
    return {
      ...this.requestContext,
      assets: this.repositoryContext.assets,
      repository: {
        ...this.requestContext.repository,
        vectorStoreId: this.vectorStoreId,
      },
    };
  }

  async execute() {
    try {
      await this.repositoryContext.resolve(this.requestContext.repository);
      const input = this.toOpenAiInput();
      const params: any = {
        model: aiConfig.modelId,
        input,
        text: { format: this.format },
      };
      if (this.vectorStoreId) {
        params.tools = [{
          type: 'file_search',
          vector_store_ids: [this.vectorStoreId],
        }];
      }
      const effort = this.reasoningEffort;
      if (effort && supportsReasoning(aiConfig.modelId)) {
        params.reasoning = { effort };
      }
      logger.debug(`Final prompt:\n${formatPrompt(input)}`);
      const response = await this.client.responses.create(params);
      this.response = this.responseProcessor(response.output_text);
      logger.info(
        { schema: this.prompt.responseSchema, type: this.prompt.type },
        'Generation complete',
      );
      return this.response;
    } catch (err) {
      logger.error(err, 'Generation failed');
      return {};
    }
  }

  get prompt() {
    return this.inputs[this.inputs.length - 1];
  }

  get prevPrompt() {
    if (this.inputs.length < 2) return null;
    return this.inputs[this.inputs.length - 2];
  }

  get isCustomPrompt() {
    const { responseSchema } = this.prompt;
    return !responseSchema || responseSchema === 'CUSTOM';
  }

  // JSON Schema for the OpenAI responses API
  get format() {
    if (this.isCustomPrompt) return undefined;
    const schema = getContentSchema(this.prompt.responseSchema)?.Schema;
    if (!schema) return undefined;
    return typeof schema === 'function' ? schema(this.context) : schema;
  }

  // Per-schema reasoning effort override
  // (if defined for schema and model supports it)
  get reasoningEffort() {
    if (this.isCustomPrompt) return undefined;
    return getContentSchema(this.prompt.responseSchema)?.reasoningEffort;
  }

  get responseProcessor() {
    const noop = (val: any) => val;
    const processor = this.isCustomPrompt
      ? noop
      : getContentSchema(this.prompt.responseSchema)?.processResponse || noop;
    return (val: string) => processor(JSON.parse(val), this.context);
  }

  // TODO: Add option to control the size of the output
  // TODO: Add option to enable web search tool
  toOpenAiInput(): OpenAI.Responses.ResponseInputItem[] {
    const res: OpenAI.Responses.ResponseInputItem[] = [];
    res.push({ role: 'developer', content: systemPrompt });
    const mode = resolveContentMode(this.requestContext.repository?.schemaId);
    res.push({ role: 'developer', content: buildAuthoringRules(mode) });
    res.push({ role: 'developer', content: this.repositoryContext.toString() });
    if (this.vectorStoreId) {
      res.push({ role: 'developer', content: documentPrompt });
    }
    if (this.prevPrompt) res.push(this.processUserInput(this.prevPrompt));
    if (this.content) res.push({ role: 'assistant', content: this.content });
    res.push(this.processUserInput(this.prompt));
    return res;
  }

  processUserInput(userInput: AiInput): OpenAI.Responses.ResponseInputItem {
    const {
      type,
      text,
      responseSchema,
      targetAudience = 'INTERMEDIATE',
    } = userInput;
    const base = `The user asked to ${type} the content.`;
    const target = `The target audience is ${targetAudience.toLowerCase()}.`;
    const responseSchemaDescription =
      responseSchema === 'CUSTOM'
        ? 'Return the response as a JSON object.'
        : getContentSchema(responseSchema).getPrompt(this.context);
    return {
      role: 'user',
      content: `${base} ${text}. ${responseSchemaDescription} ${target}`,
    };
  }
}
