import type { AiResponseSchema } from '@tailor-cms/interfaces/ai.ts';

import type { AiResponseSpec } from './interfaces';
import CeHtml from './CeHtml.ts';
import CeQuestion from './CeQuestion.ts';
import Outline from './Outline.ts';
import Tag from './Tag.ts';
import PluginRegistry from '#shared/content-plugins/index.js';

const { elementRegistry } = PluginRegistry;

const specs = {
  HTML: CeHtml,
  OUTLINE: Outline,
  QUESTION: CeQuestion,
  TAG: Tag,
};

export default (schema: AiResponseSchema | string): AiResponseSpec => {
  const spec = elementRegistry.getAiConfig(schema) ?? specs[schema];
  if (!spec) throw new Error(`No response spec found for: ${schema}`);
  return spec as AiResponseSpec;
};
