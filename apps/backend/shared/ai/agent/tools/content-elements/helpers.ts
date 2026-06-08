// Content-element-domain helpers: lookups, normalization, positioning,
// and batch creation. Activity tools that create elements (create-container)
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { createAiLogger } from '../../../logger.ts';
import { dbContext } from '../helpers/index.ts';
import { randomUUID } from 'node:crypto';
import { storage as storageConfig } from '#config';
import { toEmbedUrl } from '@tailor-cms/common/asset';
import type { ToolContext } from '../types.ts';
import db from '#shared/database/index.js';
import elementRegistry from '../../../../content-plugins/elementRegistry.js';

const { ContentElement } = db as any;

const logger = createAiLogger('agent.tools.content-elements');

// Find by PK + verify repo ownership. Returns null if not found or
// belongs to a different repository.
export async function findElement(id: number, ctx: ToolContext) {
  const el = await ContentElement.findByPk(id);
  return el?.repositoryId === ctx.repository.id ? el : null;
}

// Pick the fields the LLM needs to see for a content element.
// Raw data included so the model can interpret any element type
// without us maintaining type-specific parsers.
export function pickElementFields(e: any) {
  return {
    id: e.id,
    type: e.type,
    activityId: e.activityId,
    position: e.position,
    data: e.data,
  };
}

// Next available position for an element appended to an activity.
// Returns MAX(position) + 1; returns 1 when the activity has no elements.
// Paranoid mode auto-filters deleted_at IS NULL.
export async function nextElementPosition(
  repositoryId: number,
  activityId: number,
): Promise<number> {
  const max = await ContentElement.max('position', {
    where: { repositoryId, activityId, detached: false },
  });
  return (Number(max) || 0) + 1;
}

// Write-side normalization for AI-generated IMAGE element data.
// The ContentElement model only resolves storage URIs on READ
// (resolveStatics in afterCreate/afterFind hooks converts storage://
// to signed public URLs for API responses). There is no beforeCreate
// hook that normalizes the incoming format. The AI may produce data
// with a raw storageKey, a presigned URL, or a legacy repository/ path
// depending on the generation path. This ensures the canonical
// storage:// format before ContentElement.create().
function normalizeImageData(data: any): any {
  if (!data) return data;
  const uri = resolveStorageUri(data);
  if (!uri) return data;
  const out = {
    ...data,
    url: uri,
    assets: { ...data.assets, url: uri },
  };
  delete out.storageKey;
  return out;
}

// Extract or confirm a storage:// URI from IMAGE element data.
// The AI may produce URLs in two forms:
//   1. Already canonical: storage://repository/5/assets/uuid__photo.png
//      -> return as-is (found in data.assets.url or data.url)
//   2. Presigned S3 URL: https://bucket.s3.../repository/5/assets/uuid__photo.png?Signature=...
//      -> extract the key portion, wrap with storage:// protocol
// Returns null when the data contains no recognizable storage reference
// (e.g. an external URL like https://example.com/photo.jpg).
function resolveStorageUri(data: any): string | null {
  const protocol = storageConfig.protocol;
  const url = data.assets?.url || data.url;
  if (!url) return null;
  if (url.startsWith(protocol)) return url;
  const match = url.match(/(repository\/\d+\/assets\/[^?]+)/);
  return match ? `${protocol}${match[1]}` : null;
}

// Wrap a question element's text body as an inline TIPTAP_HTML embed.
function wrapQuestionContent(data: any): any {
  if (typeof data?.question !== 'string') return data;
  const id = randomUUID();
  return {
    ...data,
    question: [id],
    embeds: {
      [id]: {
        id,
        type: ContentElementType.TiptapHtml,
        embedded: true,
        position: 1,
        data: { content: data.question },
      },
    },
  };
}

// Normalize AI-generated element data
export function normalizeElementData(elementType: string, data: any): any {
  let normalized = data;
  if (elementType === ContentElementType.Image) {
    normalized = normalizeImageData(normalized);
  } else if (elementType === ContentElementType.Embed && normalized?.url) {
    normalized = {
      ...normalized,
      url: toEmbedUrl(normalized.url) || normalized.url,
    };
  }
  if (elementRegistry.isQuestion(elementType)) {
    normalized = wrapQuestionContent(normalized);
  }
  return normalized;
}

export interface FailedElement {
  index: number;
  type: string;
  reason: string;
}

// Batch-create content elements under a parent activity.
// Per-element failures are non-fatal; collected into `failed` so
// callers can surface them in the tool result and the model can
// self-correct. Position starts after the last existing element.
export async function createElements(
  parentId: number,
  items: any[],
  ctx: ToolContext,
): Promise<{ created: any[]; failed: FailedElement[] }> {
  const created: any[] = [];
  const failed: FailedElement[] = [];
  let pos = await nextElementPosition(ctx.repository.id, parentId);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    try {
      const data = normalizeElementData(it.type, it.data);
      const element = await ContentElement.create(
        {
          type: it.type,
          data,
          position: pos++,
          activityId: parentId,
          repositoryId: ctx.repository.id,
        },
        { context: dbContext(ctx) },
      );
      created.push(pickElementFields(element));
    } catch (err: any) {
      logger.warn(
        { err: err.message, type: it.type, index: i },
        'element create failed',
      );
      failed.push({
        index: i,
        type: it.type,
        reason: err.message || 'unknown',
      });
    }
  }
  return { created, failed };
}
