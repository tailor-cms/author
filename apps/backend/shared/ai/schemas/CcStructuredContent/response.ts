// Response processing for structured content.
// Transforms AI output into Tailor element format,
// resolving media assetIds to storage:// URLs.
import type {
  AiContext,
  AssetReference,
} from '@tailor-cms/interfaces/ai.ts';

import { createLogger } from '#logger';
import elementRegistry from '../../../content-plugins/elementRegistry.js';
import { MEDIA_SCHEMAS, processMediaElement } from './media.ts';

const logger = createLogger('ai:structured-content');

const getAiSpec = (type: string) =>
  elementRegistry.getAiConfig(type);

const processElement = (
  el: any,
  assets: AssetReference[],
) => {
  const { type, ...rawContent } = el;
  // Media types are handled by processMediaElement
  // (resolves assetId → native element data)
  if (type in MEDIA_SCHEMAS) {
    return processMediaElement(el, assets);
  }
  const spec = getAiSpec(type);
  const data = spec?.processResponse
    ? spec.processResponse(rawContent)
    : rawContent;
  return { type, data };
};

export const processResponse = (
  data: any = {},
  context?: AiContext,
) => {
  const assets = context?.assets || [];
  const subcontainers = data?.subcontainers || [];
  const result = subcontainers.map((sc: any) => ({
    ...sc,
    elements: (sc.elements || [])
      .map((el: any) => processElement(el, assets))
      .filter(Boolean),
  }));
  const allElements = result.flatMap(
    (sc: any) => sc.elements,
  );
  const typeCounts: Record<string, number> = {};
  for (const el of allElements) {
    typeCounts[el.type] =
      (typeCounts[el.type] || 0) + 1;
  }
  logger.info({
    subcontainers: result.length,
    totalElements: allElements.length,
    elementTypes: typeCounts,
  }, 'Processed response');
  return result;
};
