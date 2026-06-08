// Response post-processing for CcContainer. Dispatches by shape and
// transforms raw AI output into the items[] payload the agent's write
// tools consume.
import { randomUUID } from 'node:crypto';
import type {
  AiContext,
  AssetReference,
} from '@tailor-cms/interfaces/ai.ts';
import type { FlatConfig, NestedConfig, PropsConfig } from './types.ts';
import { MEDIA_SCHEMAS, processMediaElement } from './media.ts';
import { createAiLogger } from '../../logger.ts';
import { getCeAiSpec } from './schema.ts';
import { getConfigs } from './config.ts';

const logger = createAiLogger('cc-container');

// Run the element type's processResponse (e.g. MULTIPLE_CHOICE adds
// embeds/questionId) and split MEDIA types onto their own path so
// assetId references resolve to storage:// URLs.
const processElement = (
  el: any,
  assets: AssetReference[],
) => {
  const { type, ...rawContent } = el;
  if (type in MEDIA_SCHEMAS) {
    return processMediaElement(el, assets);
  }
  const spec = getCeAiSpec(type);
  const data = spec?.processResponse
    ? spec.processResponse(rawContent)
    : rawContent;
  return { type, data };
};

export const processResponse = (
  data: any = {},
  context?: AiContext,
) => {
  if (!context) return data;
  const cfg = getConfigs(context);
  switch (cfg.shape) {
    case 'nested': return processNested(data, cfg, context);
    case 'flat': return processFlat(data, cfg, context);
    case 'props': return processProps(data, cfg, context);
  }
};

function processNested(
  data: any,
  _cfg: NestedConfig,
  context: AiContext,
) {
  const assets = context.assets || [];
  const subcontainers = data?.subcontainers || [];
  const result = subcontainers.map((sc: any) => ({
    ...sc,
    elements: (sc.elements || [])
      .map((el: any) => processElement(el, assets))
      .filter(Boolean),
  }));
  logSummary('nested', result);
  return result;
}

function processFlat(
  data: any,
  cfg: FlatConfig,
  context: AiContext,
) {
  const assets = context.assets || [];
  const items = data?.items || [];
  const result = items.map((item: any) => ({
    type: item.type || cfg.container.type,
    data: {},
    elements: (item.elements || [])
      .map((el: any) => processElement(el, assets))
      .filter(Boolean),
  }));
  logSummary('flat', result);
  return result;
}

// Props output: collapse the AI's {data: {key: value}} into the
// container.data shape with content-element props wrapped as
// embedded elements (id + type + embedded:true + data) so the
// collection-item write path persists them under data.<key>.
// Then surface as a single-item items[] so generate_container_content's
// downstream contract stays uniform across shapes.
function processProps(
  data: any,
  cfg: PropsConfig,
  context: AiContext,
) {
  const assets = context.assets || [];
  const slotData = data?.data || {};
  const containerData: Record<string, any> = {};
  for (const prop of cfg.props) {
    const raw = slotData[prop.key];
    if (raw === undefined) continue;
    if (!prop.isContentElement) {
      containerData[prop.key] = raw;
      continue;
    }
    const processed = processElement({ type: prop.type, ...raw }, assets);
    if (!processed) continue;
    containerData[prop.key] = {
      id: randomUUID(),
      type: prop.type,
      embedded: true,
      data: processed.data,
    };
  }
  const result = [{
    type: cfg.container.type,
    data: containerData,
    elements: [],
  }];
  logger.info({
    shape: 'props',
    containerType: cfg.container.type,
    filledProps: Object.keys(containerData),
  }, 'Processed response');
  return result;
}

function logSummary(shape: string, items: any[]) {
  const allElements = items.flatMap((it: any) => it.elements);
  const typeCounts: Record<string, number> = {};
  for (const el of allElements) {
    typeCounts[el.type] = (typeCounts[el.type] || 0) + 1;
  }
  logger.info({
    shape,
    items: items.length,
    totalElements: allElements.length,
    elementTypes: typeCounts,
  }, 'Processed response');
}
