import type { AiContext } from '@tailor-cms/interfaces/ai.ts';
import OpenAI from 'openai';

import { AiPrompt } from './lib/AiPrompt.ts';
import { ai as aiConfig } from '#config';

class AiService {
  #openai;

  constructor() {
    this.#openai = new OpenAI({ apiKey: aiConfig.secretKey });
  }

  generate(context: AiContext) {
    const prompt = new AiPrompt(this.#openai, context);
    return prompt.execute();
  }
}

export default aiConfig.secretKey ? new AiService() : {};
