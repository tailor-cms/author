import path from 'node:path';
import { ContentType } from '@tailor-cms/interfaces/discovery';
import { createLogger } from '#logger';
import { detectLinkProvider } from '@tailor-cms/common/asset';
import { lookup as lookupMimeType } from 'mime-types';
import { Op } from 'sequelize';
import { randomUUID } from 'node:crypto';
import { storage as storageConfig } from '#config';
import { USER_SUMMARY_ATTRS } from '#app/user/schemas/entity.ts';
import db from '#shared/database/index.js';
import pick from 'lodash/pick.js';
import uniq from 'lodash/uniq.js';
import upperFirst from 'lodash/upperFirst.js';

import {
  type AssetAttribution,
  type BufferedFile,
  type ImportFileOptions,
  type ImportLinkMeta,
  type ListFilter,
  type StoredFile,
  VideoLinkMode,
} from './schemas/index.ts';
import { AssetType, type Asset, type AssetMeta } from './models/asset.model.js';
import {
  buildAttachmentKey,
  buildStorageKey,
} from './utils/storage-key.ts';
import { downloadFile } from './utils/download.ts';
import { extractDimensions } from './utils/image.ts';
import { fetchOpenGraph } from './extraction/open-graph.ts';
import { normalizeFolder } from './utils/folder.ts';
import { removeFromStore } from './indexing/indexing.service.ts';
import type { Repository } from '../repository/models/repository.model.js';
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
 * Derives a human-friendly display name from a storage filename, used when the
 * archive carries no original asset name. The extension is surfaced separately
 * (meta.extension), so it's dropped; separators become spaces and the first
 * letter is capitalised: `pizza-poster.png` -> `Pizza poster`. Slug-like names
 * (e.g. `img-4tv0...`) stay as-is - only the export-side original name fixes
 * those.
 */
function toReadableName(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '');
  const words = base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return upperFirst(words) || filename;
}

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

/**
 * Registers an already-stored file as a library asset.
 * On repository import the archive's static files are written to storage under
 * their original keys (and referenced by element `data.assets`), but no Asset
 * library record is created. This adds that record, pointing at the existing
 * storage object.
 */
export async function registerStorageAsset({
  repositoryId,
  userId,
  storageKey,
  name,
  meta,
}: {
  repositoryId: number;
  userId: number;
  storageKey: string;
  // When the archive carried the source asset's library record, its original
  // name + meta (folder, tags, dimensions, ...) flow through here
  name?: string;
  meta?: Record<string, any>;
}) {
  const basename = path.basename(storageKey);
  const filename = basename.split('__').pop() || basename;
  const mimeType = lookupMimeType(filename) || undefined;
  const assetType = resolveType(mimeType);
  // Archive carried the original record: restore it as-is (same file, so its
  // meta already holds folder/dimensions/etc.)
  if (meta) {
    return Asset.create({
      repositoryId,
      type: assetType,
      storageKey,
      name: name || toReadableName(filename),
      meta,
      uploaderId: userId,
    });
  }
  const extension = path.extname(filename).replace('.', '').toLowerCase();
  // Read bytes only for images, to capture dimensions (and size) without
  // pulling large media (video/pdf) fully into memory.
  let dimensions: ReturnType<typeof extractDimensions> = null;
  let fileSize: number | undefined;
  if (assetType === AssetType.Image) {
    try {
      const buffer = await Storage.getFile(storageKey);
      if (buffer) {
        fileSize = buffer.length;
        dimensions = extractDimensions(buffer);
      }
    } catch (err) {
      logger.warn({ err, storageKey }, 'Unable to read imported asset for meta');
    }
  }
  logger.debug(
    { repositoryId, storageKey, type: assetType },
    'Registering imported asset',
  );
  return Asset.create({
    repositoryId,
    type: assetType,
    storageKey,
    name: toReadableName(filename),
    meta: {
      ...(fileSize !== undefined && { fileSize }),
      ...(mimeType && { mimeType }),
      ...(extension && { extension }),
      ...(dimensions && dimensions),
    },
    uploaderId: userId,
  });
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
    search, type, folder, offset = 0, limit = 100, signed = false,
    sortBy = 'createdAt', sortOrder = 'DESC',
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
        [Op.or]: [{ [FOLDER_COLUMN]: { [Op.is]: null } }, { [FOLDER_COLUMN]: '' }],
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
 * WHERE fragment matching rows that reference `storageKey` anywhere in the given
 * JSONB column (serialized to text). Storage keys are globally unique (uuid-
 * based), so a substring hit is a real reference - and it catches every shape
 * (data.assets map, meta `url`, embeds, activity/repo File meta) without knowing
 * the path. `strpos` avoids LIKE wildcard escaping (keys contain `_`).
 */
function referencesAsset(column: string, storageKey: string) {
  const haystack = db.sequelize.cast(db.sequelize.col(column), 'text');
  return db.sequelize.where(db.sequelize.fn('strpos', haystack, storageKey), {
    [Op.gt]: 0,
  });
}

/**
 * Finds where an asset is referenced within its repository: content elements
 * (data/meta), activity-level File meta, and repository-level File meta.
 * On-demand scan, no reverse index. LINK assets (no storageKey) are never
 * embedded, so they have no usages. Bounded to one repository's rows.
 */
export async function findUsages(repository: Repository, asset: Asset) {
  const repositoryId = repository.id;
  const { storageKey } = asset;
  if (!storageKey) return [];
  const [elementRows, activityRows, repoMatch] = await Promise.all([
    ContentElement.findAll({
      where: {
        repositoryId,
        [Op.or]: [
          referencesAsset('data', storageKey),
          referencesAsset('meta', storageKey),
        ],
      },
      attributes: ['id', 'uid', 'type', 'activityId'],
    }),
    Activity.findAll({
      where: {
        repositoryId,
        detached: false,
        [Op.and]: [referencesAsset('data', storageKey)],
      },
      attributes: ['id', 'type', 'data'],
    }),
    Repository.findOne({
      where: {
        id: repositoryId,
        [Op.and]: [referencesAsset('data', storageKey)],
      },
      attributes: ['id', 'name'],
    }),
  ]);
  // Elements live in container activities; resolve each to its outline activity
  // so the usage can deep-link into the editor and show a page name. The
  // paranoid findAll excludes deleted containers, and we skip deleted outlines,
  // so elements orphaned in removed content resolve to nothing.
  const containerIds = uniq(elementRows.map((it: any) => it.activityId));
  const containers = containerIds.length
    ? await Activity.findAll({ where: { id: containerIds } })
    : [];
  const outlineByContainer = new Map<number, any>();
  await Promise.all(
    containers.map(async (container: any) => {
      const outline = await container.getFirstOutlineItem();
      if (outline && !outline.deletedAt) {
        outlineByContainer.set(container.id, outline);
      }
    }),
  );
  // Only report references that resolve to a live, navigable page; a reference
  // sitting in deleted/detached content isn't a real usage.
  const usages: any[] = [];
  elementRows.forEach((el: any) => {
    const outline = outlineByContainer.get(el.activityId);
    if (!outline) return;
    usages.push({
      type: 'element',
      elementUid: el.uid,
      elementType: el.type,
      activityId: outline.id,
      activityName: outline.data?.name ?? null,
    });
  });
  activityRows.forEach((a: any) => {
    usages.push({
      type: 'activity',
      activityId: a.id,
      activityName: a.data?.name ?? null,
    });
  });
  if (repoMatch) {
    usages.push({ type: 'repository', repositoryName: repoMatch.name });
  }
  return usages;
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
  const folders = rows.map((row) => normalizeFolder(row.folder)).filter(Boolean);
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

export async function updateMeta(asset: Asset, meta: Partial<AssetMeta>) {
  logger.debug({ assetId: asset.id }, 'Updating asset meta');
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
  return asset.update({ meta: { ...asset.meta, ...meta } });
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
    asset.repositoryId, fileKey, file.originalname,
  );
  await Storage.saveFile(storageKey, file.buffer, { ContentType: file.mimetype });
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
        'title', 'description', 'thumbnail', 'favicon',
        'domain', 'siteName', 'ogType',
      ]),
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
