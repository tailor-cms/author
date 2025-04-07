import type { AiContext } from '@tailor-cms/interfaces/ai.ts';
import OpenAI from 'openai';

import { AIPrompt } from './lib/AIPrompt.ts';
import { ai as aiConfig } from '#config';

class AiService {
  #openai;

  constructor() {
    this.#openai = new OpenAI({ apiKey: aiConfig.secretKey });
  }

  generate(context: AiContext) {
    const prompt = new AIPrompt(this.#openai, context);
    return prompt.execute();
  }
}

export default aiConfig.secretKey ? new AiService() : {};
