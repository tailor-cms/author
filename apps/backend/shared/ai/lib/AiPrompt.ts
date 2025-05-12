import type { AiContext, AiInput } from '@tailor-cms/interfaces/ai.ts';
import type { OpenAI } from 'openai';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import StorageService from '../../storage/storage.service.js';

import getContentSchema from '../schemas/index.ts';
import RepositoryContext from './RepositoryContext.ts';

import { ai as aiConfig } from '#config';

const systemPrompt = `
  Assistant is a bot desinged to help authors to create content for
  Courses, Q&A content, Knowledge base, etc.
  Rules:
  - Use the User rules to generate the content
  - Generated content should have a friendly tone and be easy to understand
  - Generated content should not include any offensive language`;

export class AiPrompt {
  // OpenAI client
  private client: OpenAI;
  // Context of the request
  private context: AiContext;
  // Information about the repository, content location, topic, etc.
  private repositoryContext: RepositoryContext;
  // User, assistant or system generated inputs
  private inputs: AiInput[];
  // Existing content, relevant for the context
  private content: string;
  // Response
  private response: any;

  constructor(client: OpenAI, context: AiContext) {
    if (!context?.inputs?.length) throw new Error('Prompt not provided');
    this.repositoryContext = new RepositoryContext(context.repository);
    this.content = context.content || '';
    this.inputs = context.inputs;
    this.client = client;
    this.context = context;
  }

  async execute() {
    try {
      const response = await this.client.responses.create({
        model: aiConfig.modelId,
        input: this.toOpenAiInput(),
        text: { format: this.format },
      } as OpenAI.Responses.ResponseCreateParamsNonStreaming);
      this.response = this.responseProcessor(response.output_text);
      this.response = await this.applyImageTool();
      return this.response;
    } catch {
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
    return this.isCustomPrompt
      ? undefined
      : getContentSchema(this.prompt.responseSchema)?.Schema;
  }

  get responseProcessor() {
    const noop = (val: any) => val;
    const processor = this.isCustomPrompt
      ? noop
      : getContentSchema(this.prompt.responseSchema)?.processResponse || noop;
    return (val) => processor(JSON.parse(val));
  }

  // TODO: Add option to control the size of the output
  // TODO: Add option to enable web search tool
  // TODO: Add support for the file upload tool
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
    return {
      role: 'user',
      content: `${base} ${text}. ${responseSchemaDescription} ${target}`,
    };
  }

  async applyImageTool() {
    if (
      !this.prompt.useImageGenerationTool ||
      this.prompt.responseSchema !== 'HTML'
    )
      return this.response;
    // output needs to be sliced to avoid exceeding the max length
    const userPrompt = `
      ${this.repositoryContext.toString()}
      Generate appropriate image for the given topic and content:
      ${JSON.stringify(this.response).slice(0, 1000)}`;
    const imgUrl = await this.generateImage(userPrompt);
    const imgInternalUrl = await StorageService.downloadToStorage(imgUrl);
    const imageElement = {
      type: ContentElementType.Image,
      data: {
        assets: { url: imgInternalUrl },
      },
    };
    const [firstElement, ...restElements] = this.response;
    return [firstElement, imageElement, ...restElements];
  }

  private async generateImage(prompt) {
    const { data } = await this.client.images.generate({
      model: 'dall-e-3',
      prompt,
      // amount of images, max 1 for dall-e-3
      n: 1,
      // 'standard' | 'hd'
      quality: 'hd',
      size: '1024x1024',
      style: 'natural',
    });
    return new URL(data[0].url as string);
  }
}
