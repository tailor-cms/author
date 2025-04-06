import type { AiContext, AiInput } from '@tailor-cms/interfaces/ai.ts';
import type { OpenAI } from 'openai';

import getContentSchema from '../schemas/index.ts';
import RepositoryContext from './RepositoryContext.ts';

import { ai as aiConfig } from '#config';

const systemPrompt = `
  Asistant is a bot desinged to help users to create content for
  Courses, Q&A content, Knowledge base, etc.
  Rules:
  - Use the User rules to generate the content
  - Generated content should have a friendly tone and be easy to understand
  - Generated content should not include any offensive language or content`;

export class AIPrompt {
  // Context of the request
  private context: AiContext;
  // Information about the repository, content location, topic, etc.
  private repositoryContext: RepositoryContext;
  // User, assistant or system generated inputs
  private inputs: AiInput[];
  // Existing content
  private content: string;
  // OpenAI client
  private client: OpenAI;

  constructor(client: OpenAI, context: AiContext) {
    if (!context?.inputs?.length) throw new Error('Prompt not provided');
    this.client = client;
    this.repositoryContext = new RepositoryContext(context.repository);
    this.inputs = context.inputs;
    this.content = context.content || '';
    this.context = context;
  }

  async execute() {
    let parsedResponse;
    try {
      const response = await this.client.responses.create({
        model: aiConfig.modelId,
        input: this.toOpenAiInput(),
        text: {
          format: this.format,
        },
      });
      parsedResponse = JSON.parse(response.output_text);
    } catch {
      return [];
    }
    const processor = getContentSchema(this.prompt.responseSchema)?.processResponse;
    return processor ? processor(parsedResponse) : parsedResponse;
  }

  get prompt() {
    return this.inputs[this.inputs.length - 1];
  }

  get prevPrompt() {
    if (this.inputs.length < 2) return null;
    return this.inputs[this.inputs.length - 2];
  }

  get format() {
    const { responseSchema } = this.prompt;
    if (!responseSchema || responseSchema === 'CUSTOM') return undefined;
    return getContentSchema(responseSchema).Schema;
  }

  // TODO: Add option to control the size of the output
  // TODO: Add option enable web search tool
  // TODO: Add support for the file upload tool
  // TODO: Add support for the image generation tool
  toOpenAiInput(): OpenAI.Responses.ResponseInputItem[] {
    const res: OpenAI.Responses.ResponseInputItem[] = [];
    res.push({ role: 'developer', content: systemPrompt });
    res.push({ role: 'developer', content: this.repositoryContext.toString() });
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
    const content = `${base} ${text}. ${responseSchemaDescription} ${target}`;
    return {
      role: 'user',
      content,
    };
  }
}
