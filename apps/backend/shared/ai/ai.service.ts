import type { AiContext, ImageDescription } from '@tailor-cms/interfaces/ai.ts';
import OpenAI from 'openai';

import { ai as aiConfig } from '#config';
import { createLogger } from '#logger';
import { AiPrompt } from './lib/AiPrompt.ts';
import { VectorStoreService } from './lib/VectorStoreService.ts';
import {
  PROMPT as IMAGE_PROMPT,
  Schema as IMAGE_SCHEMA,
} from './schemas/ImageDescription.ts';

const logger = createLogger('ai:service');

class AiService {
  #openai;
  vectorStore: VectorStoreService;

  constructor() {
    this.#openai = new OpenAI({ apiKey: aiConfig.secretKey });
    this.vectorStore = new VectorStoreService(this.#openai);
  }

  get client() {
    return this.#openai;
  }

  async generate(context: AiContext) {
    const prompt = new AiPrompt(this.#openai, context);
    return prompt.execute();
  }

  // Describe and grade an image using vision.
  async describeImage(
    imageUrl: string,
    context?: string,
  ): Promise<ImageDescription> {
    logger.debug({ imageUrl }, 'Describing image via vision');
    const prompt = context
      ? `${IMAGE_PROMPT}\n\nContext: This image is part of a course about: ${context}`
      : IMAGE_PROMPT;
    const response = await this.#openai.responses.create({
      model: aiConfig.modelId,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_image',
              image_url: imageUrl,
              detail: 'auto',
            },
            { type: 'input_text', text: prompt },
          ],
        },
      ],
      text: { format: IMAGE_SCHEMA },
    });
    const result: ImageDescription = JSON.parse(response.output_text);
    logger.debug(
      { quality: result.quality, relevance: result.relevanceScore },
      'Vision description complete',
    );
    return result;
  }
}

export default aiConfig.secretKey ? new AiService() : ({} as AiService);
