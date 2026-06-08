// Asset entity and its related sub-shapes.
import {
  AssetType,
  LinkContentType,
  ProcessingStatus,
} from '@tailor-cms/interfaces/asset.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

import {
  Int,
  IntParam,
  RepositoryScopedParams,
  UInt,
  Uid,
  timestamps,
} from '#shared/request/schemas.ts';
import { UserSummary } from '#app/user/schemas/entity.ts';

// Re-export the runtime enums so schema consumers can reach them through
// the schema barrel without a second import.
export { AssetType, ProcessingStatus, LinkContentType };

// Path param shape for every `/:assetId` route. Slices extend
// RepositoryScopedParams so the OpenAPI doc reflects the full path param set.
export const AssetItemParams = RepositoryScopedParams.extend({
  assetId: IntParam().describe('Numeric asset id (path param).'),
});

export type AssetItemParams = z.infer<typeof AssetItemParams>;

// Source attribution for an imported asset (URL, author, license).
// Present when attribution is known.
export const AssetSource = z
  .object({
    url: z.url().describe('Canonical source URL.'),
    domain: z.string().describe('Hostname of the source URL.'),
    title: z.string().optional().describe('Source page title.'),
    author: z.string().optional().describe('Content author, if known.'),
    license: z
      .string()
      .optional()
      .describe('License identifier (e.g. CC-BY-4.0).'),
  })
  .meta({ id: 'AssetSource' })
  .describe('Source attribution for an imported asset.');

export type AssetSource = z.infer<typeof AssetSource>;

// Resolved pointer to a stored file. Returned by service.getDownloadUrl.
// Mirrors the FileInput CE convention where `url` is the internal storage:// URI
// and `publicUrl` is the signed HTTPS URL clients actually render.
export const StorageRef = z
  .object({
    key: z.string().describe('Storage key.'),
    publicUrl: z.string().describe('Pre-signed HTTPS download URL.'),
    url: z.string().describe('Internal `storage://<key>` URI.'),
  })
  .meta({ id: 'StorageRef' })
  .describe('Resolved pointer to a stored file.');

export type StorageRef = z.infer<typeof StorageRef>;

// Fields shared by every asset meta variant. Lifted to a Base schema so
// each variant only declares what's truly distinct.
const AssetMetaBase = z.object({
  description: z.string().optional().describe('Free-form description.'),
  tags: z.array(z.string()).optional().describe('User-supplied tag labels.'),
  // fileKey -> storageKey, e.g. `{ captions: "repo/1/.../captions.vtt" }`.
  // Managed by the dedicated /:assetId/file endpoint
  files: z
    .record(z.string(), z.string())
    .optional()
    .describe('Map of fileKey -> stored attachment key (captions, etc.).'),
  isCoreSource: z
    .boolean()
    .optional()
    .describe('Primary knowledge source for AI generation.'),
  source: AssetSource.optional().describe('Source attribution if imported.'),
});

// Metadata for file-based asset types
export const FileAssetMeta = AssetMetaBase.extend({
  fileSize: UInt().describe('Byte size of the stored file.'),
  mimeType: z.string().describe('MIME type returned by the upload.'),
  extension: z
    .string()
    .optional()
    .describe('Lowercased extension without leading dot (e.g. "jpg").'),
  width: Int().optional().describe('Image width in pixels.'),
  height: Int().optional().describe('Image height in pixels.'),
})
  .meta({ id: 'FileAssetMeta' })
  .describe('Metadata for file-based asset types.');

export type FileAssetMeta = z.infer<typeof FileAssetMeta>;

// Metadata for LINK assets - built from the link target's OG/Twitter card
// data plus discovery attribution. `description` is required here (always
// present on OG-collected data).
export const LinkAssetMeta = AssetMetaBase.extend({
  url: z.url().describe('Target URL of the link asset.'),
  title: z.string().describe('Title collected from the target page.'),
  description: z.string().describe('Description collected from the target page.'),
  thumbnail: z.string().describe('Preview image URL (may be empty string).'),
  favicon: z.string().describe('Favicon URL of the source domain.'),
  domain: z.string().describe('Hostname of the target URL.'),
  siteName: z
    .string()
    .optional()
    .describe('Publisher site name (OG:site_name).'),
  ogType: z.string().optional().describe('Raw `og:type` value if present.'),
  contentType: z
    .enum(LinkContentType)
    .optional()
    .describe('Discovery-derived content classification.'),
  provider: z.string().optional().describe(`Known provider (youtube, vimeo...).`),
  altText: z
    .string()
    .optional()
    .describe('Alt text for image-style link previews.'),
})
  .meta({ id: 'LinkAssetMeta' })
  .describe('Metadata for LINK asset type.');

export type LinkAssetMeta = z.infer<typeof LinkAssetMeta>;

// Union of meta variants. The discriminator lives on `Asset.type`, not
// on the meta itself, so this is a plain union (rendered as `oneOf` in
// OpenAPI).
export const AssetMeta = z.union([FileAssetMeta, LinkAssetMeta])
  .describe(`Type-specific meta for the asset; shape depends on \`type\`.`);

export type AssetMeta = z.infer<typeof AssetMeta>;

// The full Asset entity as returned by the API. Single shape to mirror the
// model declaration in `models/asset.model.d.ts`; consumers narrow by `type` when
// they need a specific variant.
export const Asset = z
  .object({
    id: Int().describe('Numeric primary key.'),
    uid: Uid('UID identifier; persists across clones / imports.'),
    repositoryId: Int().describe('Repository the asset belongs to.'),
    name: z.string().describe('Display name; auto-truncated to 250 chars.'),
    type: z.enum(AssetType).describe(oneLine`
      Asset kind
      (IMAGE / DOCUMENT / VIDEO / AUDIO / LINK / OTHER).
    `),
    // Object-storage key for file-based assets; null for LINK assets.
    storageKey: z
      .string()
      .nullable()
      .describe('Storage key; null for LINK assets.'),
    // Pre-signed download URL; populated only when the list endpoint is
    // called with `signed=true`.
    publicUrl: z
      .string()
      .optional()
      .describe('Pre-signed access URL; only present when `signed=true`.'),
    meta: AssetMeta,
    vectorStoreFileId: z.string().nullable().describe(oneLine`
      OpenAI id for the indexed asset;
      null when not indexed.
    `),
    processingStatus: z
      .enum(ProcessingStatus)
      .nullable()
      .describe('Vector-store indexing state; null when never indexed.'),
    uploaderId: Int().describe('User who uploaded the asset.'),
    uploader: UserSummary.optional().describe('Eager-loaded uploader'),
    ...timestamps(),
  })
  .meta({ id: 'Asset' }).describe(oneLine`
    A repository asset, either an uploaded file
    (image, video, document, audio, ...) or an
    external link.
  `);

export type Asset = z.infer<typeof Asset>;
