import path from 'node:path';
import { ContentType } from '@tailor-cms/interfaces/discovery';
import { createLogger } from '#logger';
import { detectLinkProvider } from '@tailor-cms/common/asset';
import { Op } from 'sequelize';
import { randomUUID } from 'node:crypto';
import { storage as storageConfig } from '#config';
import { USER_SUMMARY_ATTRS } from '#app/user/schemas/entity.ts';
import db from '#shared/database/index.js';
import pick from 'lodash/pick.js';
import uniq from 'lodash/uniq.js';

import {
  type AssetAttribution,
  type BufferedFile,
  type ImportFileOptions,
  type ImportLinkMeta,
  type ListFilter,
  type ResolvedStorageKey,
  type StoredFile,
  VideoLinkMode,
} from './schemas/index.ts';
import type { Repository } from '../repository/models/repository.model.js';
import { AssetType, type Asset, type AssetMeta } from './models/asset.model.js';
import { buildAttachmentKey, buildStorageKey } from './utils/storage-key.ts';
import { downloadFile } from './utils/download.ts';
import { extractDimensions } from './utils/image.ts';
import { fetchOpenGraph } from './extraction/open-graph.ts';
import { normalizeFolder } from './utils/folder.ts';
import { removeFromStore } from './indexing/indexing.service.ts';
import { resolveThumbnailUrl } from './thumbnail.service.ts';
import { resolveType } from './utils/mime.ts';
import Storage from '../repository/storage.ts';

const { Activity, Asset, ContentElement, Repository, User } = db;

const logger = createLogger('asset:svc');

// Extra metadata stamped onto an asset at creation: attribution plus the
// optional virtual folder it lands in.
type CreateRecordOptions = AssetAttribution & { folder?: string };

const DOWNLOADABLE_TYPES: Set<ContentType> = new Set([
  ContentType.Image,
  ContentType.Pdf,
]);

// JSONB path to the virtual folder
const FOLDER_COLUMN = 'meta.folder';

// Sequelize WHERE fragments for video-provider link classification.
// Link assets with YouTube/Vimeo/Dailymotion URLs are shown under
// the video filter and hidden from the link filter.
const VIDEO_PROVIDERS =
  '(youtube\\.com|youtu\\.be|vimeo\\.com|dailymotion\\.com)';

const IS_VIDEO_LINK = {
  'type': AssetType.Link,
  'meta.url': { [Op.iRegexp]: VIDEO_PROVIDERS },
};

const IS_NOT_VIDEO_LINK = {
  'meta.url': { [Op.notIRegexp]: VIDEO_PROVIDERS },
};

export const UPLOADER_INCLUDE = {
  model: User,
  as: 'uploader',
  attributes: USER_SUMMARY_ATTRS,
};

/** Wraps an async fn so it logs warnings instead of throwing. */
function safe(fn: (...args: any[]) => Promise<any>) {
  return (...args: any[]) =>
    fn(...args).catch((err) => {
      logger.warn({ err }, `${fn.name || 'cleanup'} failed`);
    });
}

const safeDeleteFile = safe(Storage.deleteFile.bind(Storage));
const safeRemoveFromVectorStore = safe(removeFromStore);

/**
 * Creates the library Asset record for a file already stored at `file.key`.
 */
async function createAssetRecord(
  repositoryId: number,
  userId: number,
  file: StoredFile,
  { description, source, tags, folder }: CreateRecordOptions = {},
) {
  const { uid, key, originalname, mimetype, size, dimensions } = file;
  const normalizedFolder = normalizeFolder(folder);
  const asset = await Asset.create({
    uid,
    repositoryId,
    type: resolveType(mimetype),
    storageKey: key,
    name: source?.title || originalname,
    meta: {
      fileSize: size,
      mimeType: mimetype,
      extension: path.extname(originalname).replace('.', '').toLowerCase(),
      ...(dimensions && dimensions),
      ...(normalizedFolder && { folder: normalizedFolder }),
      ...(description && { description }),
      ...(tags?.length && { tags }),
      ...(source && { source }),
    },
    uploaderId: userId,
  });
  return asset.reload({ include: [UPLOADER_INCLUDE] });
}

/**
 * Persists an in-memory file (see `BufferedFile`) to storage and registers it as
 * a library asset. Used when the server already holds the whole file in memory;
 * link/remote downloads and AI-generated images.
 */
export async function importBufferedFile({
  repositoryId,
  userId,
  file,
  description,
  source,
  tags,
}: ImportFileOptions) {
  const { uid, key } = buildStorageKey(repositoryId, file.originalname);
  logger.debug(
    {
      repositoryId,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    },
    'Importing buffered file',
  );
  await Storage.saveFile(key, file.buffer, { ContentType: file.mimetype });
  const dimensions =
    resolveType(file.mimetype) === AssetType.Image
      ? extractDimensions(file.buffer)
      : null;
  return createAssetRecord(
    repositoryId,
    userId,
    { ...file, uid, key, dimensions },
    { description, source, tags },
  );
}

async function destroyAsset(repository: Repository, asset: Asset) {
  logger.debug({ assetId: asset.id, type: asset.type }, 'Destroying asset');
  await safeRemoveFromVectorStore(repository, asset);
  // Files are NOT deleted from storage - content elements may reference them
  // via storage:// URIs. Only the library record is removed (soft-delete).
  await asset.destroy();
}

export async function list(
  repositoryId: number,
  options: Omit<ListFilter, 'key'> = {},
) {
  const {
    search,
    type,
    folder,
    offset = 0,
    limit = 100,
    signed = false,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    videoLinkMode,
  } = options;
  logger.debug(
    { repositoryId, search, type, folder, videoLinkMode, offset, limit },
    'Listing assets',
  );
  const where: any = { repositoryId };
  // Accumulates conditions that need `Op.and`
  const and: any[] = [];
  if (videoLinkMode === VideoLinkMode.Include) {
    and.push({ [Op.or]: [{ type: AssetType.Video }, IS_VIDEO_LINK] });
  } else if (videoLinkMode === VideoLinkMode.Exclude) {
    where.type = AssetType.Link;
    Object.assign(where, IS_NOT_VIDEO_LINK);
  } else if (type) {
    where.type = Array.isArray(type) ? { [Op.in]: type } : type;
  }
  // Folder is exact-match (one level, S3 Delimiter style). Root matches assets
  // with no folder set
  if (folder !== undefined) {
    const normalized = normalizeFolder(folder);
    if (normalized) where[FOLDER_COLUMN] = normalized;
    else {
      and.push({
        [Op.or]: [
          { [FOLDER_COLUMN]: { [Op.is]: null } },
          { [FOLDER_COLUMN]: '' },
        ],
      });
    }
  }
  if (search) {
    // Escape LIKE wildcards (%, _) in Op.iLike values
    const escaped = search.replace(/[\\%_]/g, '\\$&');
    where.name = { [Op.iLike]: `%${escaped}%` };
  }
  if (and.length) where[Op.and] = and;
  const { rows, count } = await Asset.findAndCountAll({
    where,
    include: [UPLOADER_INCLUDE],
    order: [[sortBy, sortOrder]],
    offset,
    limit,
  });
  if (signed) await Asset.resolvePublicUrls(rows);
  return { items: rows, total: count };
}

/**
 * Usage detection is deliberately a plain text search. Content references
 * assets in several shapes and places (`storage://` URLs in element data,
 * bare keys in File meta, embeds in rich text), so instead of teaching the
 * scan every path, we check whether the asset's storage key appears
 * anywhere in the row's JSON, cast to text - Ctrl+F in SQL. Matching the
 * bare key catches shapes both with and without the `storage://` prefix.
 * A hit is always a real usage of exactly this asset: keys embed a random
 * uuid (`repository/8/assets/6b90c9e1-...__cat.png`), which never appears
 * by accident and never collides with another asset's key. `strpos`
 * searches literally, unlike LIKE, which treats `_` as a wildcard.
 */
function referencesAsset(column: string, storageKey: string) {
  const columnText = db.sequelize.cast(db.sequelize.col(column), 'text');
  return db.sequelize.where(db.sequelize.fn('strpos', columnText, storageKey), {
    [Op.gt]: 0,
  });
}

// A matched content row paired with the ids of the assets it references.
type AssetMatch = { row: any; assetIds: number[] };

/**
 * Scans the three places an asset can be referenced - content element
 * data/meta, activity-level File meta and repository-level File meta - for
 * the given assets' storage keys. Detached rows are leftovers of deleted
 * content and don't count. Each matched row is returned with the ids of the
 * assets it references. LINK assets carry no storage key and are never
 * embedded, so they never match.
 */
async function scanAssetReferences(
  repository: Repository,
  assets: Asset[],
): Promise<{
  elementMatches: AssetMatch[];
  activityMatches: AssetMatch[];
  repositoryMatch: AssetMatch | null;
}> {
  const keyed = assets.filter(
    (asset): asset is Asset & { storageKey: string } => !!asset.storageKey,
  );
  if (!keyed.length) {
    return { elementMatches: [], activityMatches: [], repositoryMatch: null };
  }
  const anyKeyClause = (column: string) => ({
    [Op.or]: keyed.map((asset) => referencesAsset(column, asset.storageKey)),
  });
  const [elementRows, activityRows, repositoryRow] = await Promise.all([
    ContentElement.findAll({
      where: {
        repositoryId: repository.id,
        detached: false,
        [Op.or]: [anyKeyClause('data'), anyKeyClause('meta')],
      },
      attributes: ['id', 'uid', 'type', 'activityId', 'data', 'meta'],
    }),
    Activity.findAll({
      where: {
        repositoryId: repository.id,
        detached: false,
        ...anyKeyClause('data'),
      },
      attributes: ['id', 'type', 'data'],
    }),
    Repository.findOne({
      where: { id: repository.id, ...anyKeyClause('data') },
      attributes: ['id', 'name', 'data'],
    }),
  ]);
  // Attributes a row to the assets it references: SQL only proved the row
  // contains *some* scanned key, so re-run the contains check per key here.
  const toMatch = (row: any, ...columns: string[]): AssetMatch => {
    const text = columns
      .map((column) => JSON.stringify(row[column]))
      .join('\n');
    const matched = keyed.filter((asset) => text.includes(asset.storageKey));
    return { row, assetIds: matched.map((asset) => asset.id) };
  };
  return {
    elementMatches: elementRows.map((row: any) => toMatch(row, 'data', 'meta')),
    activityMatches: activityRows.map((row: any) => toMatch(row, 'data')),
    repositoryMatch: repositoryRow && toMatch(repositoryRow, 'data'),
  };
}

/**
 * Resolves the outline activity (the navigable page) each element sits
 * under, so a usage can deep-link into the editor and show a page name.
 */
async function resolveOutlineByContainer(elementRows: any[]) {
  const containerIds = uniq(elementRows.map((el) => el.activityId));
  const byContainer = new Map<number, any>();
  if (!containerIds.length) return byContainer;
  const containers = await Activity.findAll({ where: { id: containerIds } });
  await Promise.all(
    containers.map(async (container: any) => {
      const outline = await container.getFirstOutlineItem();
      if (outline && !outline.deletedAt) byContainer.set(container.id, outline);
    }),
  );
  return byContainer;
}

/**
 * Finds where each of the given assets is referenced within the repository:
 * content elements (data/meta), activity-level File meta, and repository-level
 * File meta. On-demand scan, no reverse index. findUsages() is the single-asset
 * convenience wrapper; call this directly to resolve many assets at once (e.g. a
 * "find unused assets" audit) instead of looping findUsages().
 */
export async function findUsagesBatch(
  repository: Repository,
  assets: Asset[],
): Promise<Map<number, any[]>> {
  const usagesByAsset = new Map<number, any[]>(assets.map((a) => [a.id, []]));
  const { elementMatches, activityMatches, repositoryMatch } =
    await scanAssetReferences(repository, assets);
  const outlineByContainer = await resolveOutlineByContainer(
    elementMatches.map(({ row }) => row),
  );
  const addUsage = (assetIds: number[], usage: any) => {
    for (const id of assetIds) usagesByAsset.get(id)!.push(usage);
  };
  for (const { row, assetIds } of elementMatches) {
    // Elements only count on a live, navigable page - a reference sitting in
    // deleted content isn't a real usage.
    const outline = outlineByContainer.get(row.activityId);
    if (!outline) continue;
    addUsage(assetIds, {
      type: 'element',
      elementUid: row.uid,
      elementType: row.type,
      activityId: outline.id,
      activityName: outline.data?.name ?? null,
    });
  }
  // Activity- and repository-level File meta (thumbnails, hero images, ...).
  for (const { row, assetIds } of activityMatches) {
    addUsage(assetIds, {
      type: 'activity',
      activityId: row.id,
      activityName: row.data?.name ?? null,
    });
  }
  if (repositoryMatch) {
    addUsage(repositoryMatch.assetIds, {
      type: 'repository',
      repositoryName: repositoryMatch.row.name,
    });
  }
  return usagesByAsset;
}

export async function findUsages(repository: Repository, asset: Asset) {
  const usagesByAsset = await findUsagesBatch(repository, [asset]);
  return usagesByAsset.get(asset.id) ?? [];
}

/**
 * Existence-only check for the reuse/dedup flow: which of the given assets
 * are referenced by live content. Leaner than findUsagesBatch - it only
 * answers "used at all", not where - so it skips outline resolution.
 */
export async function findUsedAssetIds(
  repository: Repository,
  assets: Asset[],
): Promise<Set<number>> {
  const { elementMatches, activityMatches, repositoryMatch } =
    await scanAssetReferences(repository, assets);
  const matches = [...elementMatches, ...activityMatches];
  if (repositoryMatch) matches.push(repositoryMatch);
  return new Set(matches.flatMap(({ assetIds }) => assetIds));
}

// The multer engine already streamed each file to storage and stamped it with
// uid/key/size/dimensions (a StoredFile), so here we just create the records.
// `folder` (optional) is the virtual folder the batch was uploaded into.
export function registerUploads(
  repositoryId: number,
  userId: number,
  files: StoredFile[],
  folder?: string,
) {
  return Promise.all(
    files.map((file) =>
      createAssetRecord(repositoryId, userId, file, { folder }),
    ),
  );
}

/**
 * Distinct, non-empty folder paths in use across a repository's assets. These
 * are the folders that actually "exist" server-side (derived from `meta.folder`,
 * S3-console style); empty folders the user created live only client-side until
 * an asset lands in them. The frontend builds the folder tree from this flat
 * list. Bounded to one repository.
 */
export async function listFolders(repositoryId: number): Promise<string[]> {
  const rows: Array<{ folder: string | null }> = await Asset.findAll({
    where: { repositoryId },
    attributes: [
      [db.sequelize.literal(`DISTINCT (meta->>'folder')`), 'folder'],
    ],
    raw: true,
  });
  const folders = rows
    .map((row) => normalizeFolder(row.folder))
    .filter(Boolean);
  return uniq(folders).sort();
}

/**
 * Moves the given assets into `folder` (root when empty). A move is purely a
 * `meta.folder` update; the stored object's key never changes, so there is no
 * S3 copy/delete. Returns the ids that were updated.
 */
export async function moveAssets(
  repositoryId: number,
  assetIds: number[],
  folder: string,
): Promise<number[]> {
  const normalized = normalizeFolder(folder);
  const assets = await Asset.findAll({
    where: { repositoryId, id: { [Op.in]: assetIds } },
  });
  logger.debug(
    { repositoryId, count: assets.length, folder: normalized },
    'Moving assets',
  );
  await Promise.all(
    assets.map((asset: Asset) => {
      const meta = { ...asset.meta };
      // Moving to root drops the key entirely (rather than storing `''`), so
      // root assets stay uniform per the "absent = root" convention
      if (normalized) meta.folder = normalized;
      else delete meta.folder;
      return asset.update({ meta });
    }),
  );
  return assets.map((asset: Asset) => asset.id);
}

/**
 * Deletes a folder and everything under it: soft-deletes every asset whose
 * `meta.folder` is `folder` or nested beneath it (`folder/...`). Folders are
 * virtual, so removing the assets removes the folder. Root ('') is not
 * deletable. Returns the ids that were removed.
 */
export async function deleteFolder(
  repository: Repository,
  folder: string,
): Promise<number[]> {
  const normalized = normalizeFolder(folder);
  if (!normalized) return [];
  const assets = await Asset.findAll({
    where: {
      repositoryId: repository.id,
      [Op.or]: [
        { [FOLDER_COLUMN]: normalized },
        { [FOLDER_COLUMN]: { [Op.like]: `${normalized}/%` } },
      ],
    },
  });
  logger.debug(
    { repositoryId: repository.id, folder: normalized, count: assets.length },
    'Deleting folder',
  );
  const results = await Promise.allSettled(
    assets.map((it: Asset) => destroyAsset(repository, it)),
  );
  return results.reduce<number[]>((ids, r, i) => {
    if (r.status === 'rejected') {
      logger.error(
        { err: r.reason, assetId: assets[i].id },
        'Folder delete failed for asset',
      );
    } else {
      ids.push(assets[i].id);
    }
    return ids;
  }, []);
}

/**
 * Resolves a storage key to its public and internal URLs.
 * Returns { key, publicUrl, url } where url is the storage:// protocol URL.
 */
export async function getDownloadUrl(key: string) {
  const publicUrl = await Storage.getFileUrl(key);
  return {
    key,
    publicUrl,
    url: `${storageConfig.protocol}${key}`,
  };
}

/**
 * Assets whose storageKey is in the given list.
 */
export async function findByStorageKeys(
  storageKeys: string[],
): Promise<Asset[]> {
  const keys = uniq(storageKeys.filter(Boolean));
  if (!keys.length) return [];
  return Asset.findAll({ where: { storageKey: { [Op.in]: keys } } });
}

/**
 * Signs URLs for assets whose storageKey is in the given list.
 */
export async function resolveByStorageKey(
  storageKeys: string[],
): Promise<Map<string, ResolvedStorageKey>> {
  const assets = await findByStorageKeys(storageKeys);
  if (!assets.length) return new Map();
  await Asset.resolvePublicUrls(assets);
  // A miss warms in the background rather than blocking this response
  assets
    .filter((asset) => !asset.thumbnailUrl)
    .forEach((asset) => {
      resolveThumbnailUrl(asset).catch((err) => {
        logger.warn(
          { err, assetId: asset.id },
          'Background thumbnail generation failed',
        );
      });
    });
  const entries = assets.map((asset) => {
    const resolved: ResolvedStorageKey = {
      assetId: asset.id,
      publicUrl: asset.publicUrl ?? null,
      thumbnailUrl: asset.thumbnailUrl ?? null,
    };
    return [asset.storageKey!, resolved] as const;
  });
  return new Map(entries);
}

export async function updateAsset(
  asset: Asset,
  { meta, name }: { meta: Partial<AssetMeta>; name?: string },
) {
  logger.debug({ assetId: asset.id }, 'Updating asset');
  // meta.files maps fileKey → storageKey (e.g. { captions: "repo/1/..." }).
  // When a client sets a file key to null/empty, delete the stored file.
  // Example: { captions: null } removes the captions file from storage.
  // NOTE: meta.files is stripped from the update endpoint by validation;
  // this path is only reachable internally (e.g. attachFile cleanup).
  if (meta.files) {
    const existing = asset.meta?.files;
    if (existing) {
      for (const [key, val] of Object.entries(meta.files)) {
        if (!val && existing[key]) await safeDeleteFile(existing[key]);
      }
    }
  }
  return asset.update({
    meta: { ...asset.meta, ...meta },
    ...(name ? { name } : {}),
  });
}

/**
 * Attach a file to an asset under the given key in `meta.files`.
 * Replaces any previously stored file for the same key.
 */
export async function attachFile(
  asset: Asset,
  fileKey: string,
  file: BufferedFile,
) {
  logger.debug(
    { assetId: asset.id, fileKey, filename: file.originalname },
    'Attaching file to asset',
  );
  if (!asset.storageKey) {
    throw new Error('Cannot attach files to an asset without a storage key');
  }
  // NOTE: Old file is NOT deleted, published content may reference it
  const storageKey = buildAttachmentKey(
    asset.repositoryId,
    fileKey,
    file.originalname,
  );
  await Storage.saveFile(storageKey, file.buffer, {
    ContentType: file.mimetype,
  });
  const files = { ...asset.meta?.files, [fileKey]: storageKey };
  return asset.update({ meta: { ...asset.meta, files } });
}

// Merges discovery metadata with OG-extracted attribution.
// Discovery values take precedence; OG fills gaps.
function mergeAttribution(
  url: string,
  meta: ImportLinkMeta,
  og: { author: string; license: string; tags: string[] },
) {
  const domain = new URL(url).hostname;
  const author = meta.author || og.author;
  const license = meta.license || og.license;
  const hasAttribution = meta.contentType || author || license;
  const source = hasAttribution
    ? {
        url,
        domain,
        ...(meta.title && { title: meta.title }),
        ...(author && { author }),
        ...(license && { license }),
      }
    : undefined;
  const tags = [...new Set([...(meta.tags || []), ...og.tags])];
  return { source, tags };
}

export async function importFromLink(
  repositoryId: number,
  userId: number,
  url: string,
  meta: ImportLinkMeta = {},
) {
  const domain = new URL(url).hostname;
  logger.debug(
    { repositoryId, url, contentType: meta.contentType },
    'Importing from link',
  );
  // OG collection runs for all imports - enriches both file and link assets.
  // For downloadable types, runs in parallel with the file download.
  const ogPromise = fetchOpenGraph(url);
  // Downloadable types: fetch the file and store it like a regular upload.
  if (meta.contentType && DOWNLOADABLE_TYPES.has(meta.contentType)) {
    try {
      const [file, og] = await Promise.all([
        downloadFile(meta.downloadUrl || url),
        ogPromise,
      ]);
      const { source, tags } = mergeAttribution(url, meta, og);
      return await importBufferedFile({
        repositoryId,
        userId,
        file,
        description: meta.description || og.description || meta.altText,
        source,
        tags,
      });
    } catch (err) {
      logger.warn(
        { err, url },
        'File download failed, falling back to link import',
      );
    }
  }
  // Default: create as a link asset with OG metadata.
  const ogData = await ogPromise;
  const { source, tags } = mergeAttribution(url, meta, ogData);
  const detected = detectLinkProvider(url);
  const contentType = meta.contentType || detected.contentType;
  const rawName = meta.title || ogData.title || domain;
  const asset = await Asset.create({
    uid: randomUUID(),
    repositoryId,
    name: rawName,
    type: AssetType.Link,
    meta: {
      url,
      ...pick(ogData, [
        'title',
        'description',
        'thumbnail',
        'favicon',
        'domain',
        'siteName',
        'ogType',
      ]),
      // Caller-resolved preview (e.g. discovery's Google/Unsplash thumbnail)
      // wins over the page's own OG image
      ...(meta.thumbnailUrl && { thumbnail: meta.thumbnailUrl }),
      ...(contentType && { contentType }),
      ...(detected.provider && { provider: detected.provider }),
      ...(tags.length && { tags }),
      ...(source && { source }),
      ...(meta.altText && { altText: meta.altText }),
    },
    uploaderId: userId,
  });
  return asset.reload({ include: [UPLOADER_INCLUDE] });
}

export async function remove(repository: Repository, asset: Asset) {
  await destroyAsset(repository, asset);
  return asset;
}

export async function bulkRemove(repository: Repository, assetIds: number[]) {
  const assets = await Asset.findAll({
    where: { id: { [Op.in]: assetIds }, repositoryId: repository.id },
  });
  // allSettled so one failure doesn't block remaining deletions
  const results = await Promise.allSettled(
    assets.map((it: Asset) => destroyAsset(repository, it)),
  );
  return results.reduce<number[]>((ids, r, i) => {
    if (r.status === 'rejected') {
      logger.error(
        { err: r.reason, assetId: assets[i].id },
        'Bulk delete failed for asset',
      );
    } else {
      ids.push(assets[i].id);
    }
    return ids;
  }, []);
}
