import type {
  AiContext,
  AiInput,
} from '@tailor-cms/interfaces/ai.ts';
import type { OpenAI } from 'openai';

import getContentSchema from '../schemas/index.ts';
import RepositoryContext from './RepositoryContext.ts';

import { ai as aiConfig } from '#config';
import { createAiLogger, formatPrompt } from '../logger.ts';

const logger = createAiLogger('prompt');

const systemPrompt = `
  Assistant is a bot designed to help authors create content for
  Courses, Q&A content, Knowledge base, etc.
  Rules:
  - Use the User rules to generate the content
  - Generated content should have a friendly tone and be easy to understand
  - Generated content should not include any offensive language`;

const documentPrompt = `
  The user has provided source documents indexed in a vector store.
  Use the file_search tool to find relevant information from these documents.
  Base ALL generated content on information found in the documents.
  Do not invent information not present in the documents.
  If any assets are marked as PRIMARY SOURCE, they represent the core knowledge
  base. Structure and model your content primarily after these sources.
  Supplementary assets provide additional context but should not override
  the core sources.`;

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
