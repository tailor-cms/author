import type { AiResponseSchema } from '@tailor-cms/interfaces/ai.ts';

import type { AiResponseSpec } from './interfaces';
import CeHtml from './CeHtml.ts';
import CeQuestion from './CeQuestion.ts';
import Outline from './Outline.ts';
import Tag from './Tag.ts';

const specs = {
  HTML: CeHtml,
  OUTLINE: Outline,
  QUESTION: CeQuestion,
  TAG: Tag,
};

export default (schema: AiResponseSchema): AiResponseSpec => {
  const spec = specs[schema] as AiResponseSpec;
  if (!spec) throw new Error(`No response spec found for: ${schema}`);
  return spec;
};
