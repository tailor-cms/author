// Wire shapes for asset listing. Two call modes share the route:
//   - default: paginated/filtered listing
//   - key-resolve: `?key=<storageKey>` returns a signed URL ({ url })
// The 200 contract is a union so OpenAPI emits both branches.
import { AssetType } from '@tailor-cms/interfaces/asset.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

import {
  Pagination,
  QueryBoolean,
  Sort,
  UInt,
  dataEnvelope,
} from '#shared/request/schemas.ts';

import { Asset } from './entity.ts';
import { VideoLinkMode } from '../types.ts';

const ASSET_TYPES = Object.values(AssetType) as string[];
const SORT_COLUMNS = ['name', 'type', 'createdAt'] as const;

/**
 * Uniform shape returned by `parseType`. Both fields are optional so
 * the transform's spread produces a single object type instead of a
 * branch-by-branch union (which would force narrowing in every
 * consumer just to read `videoLinkMode` or `type`).
 */
type ParsedTypeFilter = {
  type?: string[];
  videoLinkMode?: VideoLinkMode;
};

/**
 * Splits a `type=video,link` CSV, validates each token, and routes
 * the result into either a plain type filter or a videoLinkMode
 * directive. Video-provider links (YouTube, Vimeo, ...) are stored
 * with type='LINK' but should appear under the video filter and
 * disappear from a lone link filter.
 *   type=video        -> videoLinkMode: 'include'
 *   type=link (only)  -> videoLinkMode: 'exclude'
 *   any other set     -> plain { type: [...] } filter
 */
function parseType(
  raw: string,
  ctx: z.RefinementCtx,
): ParsedTypeFilter | typeof z.NEVER {
  const types = raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (!types.length) return {};
  // Push a validation issue via ctx and bail with z.NEVER so the
  // surrounding transform reports failure
  if (types.some((t) => !ASSET_TYPES.includes(t))) {
    ctx.addIssue({
      code: 'custom',
      message: `type must be one or more of: ${ASSET_TYPES.join(', ')}`,
    });
    return z.NEVER;
  }
  if (types.includes(AssetType.Video)) {
    return { videoLinkMode: VideoLinkMode.Include };
  }
  if (types.length === 1 && types[0] === AssetType.Link) {
    return { videoLinkMode: VideoLinkMode.Exclude };
  }
  return { type: types };
}

// Transform reshapes the raw query for the service layer
export const ListFilter = z
  .object({
    search: z
      .string()
      .trim()
      .optional()
      .describe('Substring match on asset name (iLike).'),
    type: z.string().optional().describe(oneLine`
      CSV of AssetType values; \`video\` includes provider
      links, lone \`link\` excludes them.
    `),
    // When set, short-circuits to a signed-URL response - other
    // filter fields are ignored.
    key: z.string().optional().describe(oneLine`
        Legacy storage key lookup; response shape is \`{ url }\`.
        When set, other filters are ignored`),
    signed: QueryBoolean.optional().describe(
      'Populate each row with a pre-signed `publicUrl`.',
    ),
    ...Pagination(),
    ...Sort(SORT_COLUMNS),
  })
  .transform((raw, ctx) => {
    const { type, ...rest } = raw;
    const parsedType = type ? parseType(type, ctx) : undefined;
    return { ...rest, ...parsedType };
  })
  .describe('Filters, pagination, and sort for listing assets.');

export type ListFilter = z.infer<typeof ListFilter>;

// Default mode response: paginated rows + total count.
export const ListResult = z
  .object({
    items: z.array(Asset).describe('Page of assets.'),
    total: UInt()
      .meta({ example: 1 })
      .describe('Total assets matching the filter.'),
  })
  .meta({ id: 'AssetListResult' })
  .describe('Paginated asset list (default mode).');

export type ListResult = z.infer<typeof ListResult>;

// Legacy `{ url }` envelope for `?key=` lookups, kept for content
// elements that still resolve storage:// URIs through this endpoint.
export const KeyResolveResult = z
  .object({
    url: z.string().describe('Pre-signed download URL for the storage key.'),
  })
  .meta({ id: 'AssetKeyResolveResult' })
  .describe('Storage-key resolve response (when `?key=` is set).');

export type KeyResolveResult = z.infer<typeof KeyResolveResult>;

export const ListResponse = z
  .union([dataEnvelope(ListResult), KeyResolveResult])
  .describe('Paginated list (default) or key-resolve URL (legacy).');

export type ListResponse = z.infer<typeof ListResponse>;
