import type { AiContext } from '@tailor-cms/interfaces/ai.ts';
import OpenAI from 'openai';

import { ai as aiConfig } from '#config';
import { AiPrompt } from './lib/AiPrompt.ts';
import { VectorStoreService } from './lib/VectorStoreService.ts';

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
}

export default aiConfig.secretKey ? new AiService() : ({} as AiService);
