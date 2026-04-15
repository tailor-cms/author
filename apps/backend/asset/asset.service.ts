import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { ContentType } from '@tailor-cms/interfaces/discovery.ts';
import { detectLinkProvider } from '@tailor-cms/common/asset';
import { Op } from 'sequelize';
import pick from 'lodash/pick.js';

import { createLogger } from '#logger';
import { storage as storageConfig } from '#config';
import db from '#shared/database/index.js';

import { AssetType, type Asset, type AssetMeta } from './asset.model.js';
import {
  buildAttachmentKey,
  buildStorageKey,
} from './utils/storage-key.ts';
import { downloadFile } from './utils/download.ts';
import { extractDimensions } from './utils/image.ts';
import { resolveType } from './utils/mime.ts';
import { fetchOpenGraph } from './extraction/open-graph.ts';
import { removeFromStore } from './indexing/indexing.service.ts';
import Storage from '../repository/storage.js';
import {
  VideoLinkMode,
  type ImportFileOptions,
  type ImportFromLinkOptions,
  type ListOptions,
  type MulterFile,
} from './types.ts';

const { Asset, User } = db;

const logger = createLogger('asset:svc');

const DOWNLOADABLE_TYPES: Set<ContentType> = new Set([
  ContentType.Image,
  ContentType.Pdf,
]);

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
  attributes: ['id', 'email', 'firstName', 'lastName', 'fullName', 'label', 'imgUrl'],
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

async function importFile({
  repositoryId,
  userId,
  file,
  description,
  source,
  tags,
}: ImportFileOptions) {
  const { uid, key } = buildStorageKey(repositoryId, file.originalname);
  logger.debug({
    repositoryId,
    filename: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
  }, 'Importing file');
  await Storage.saveFile(key, file.buffer);
  // Extract image dimensions if applicable
  const assetType = resolveType(file.mimetype);
  const dimensions = assetType === AssetType.Image
    ? extractDimensions(file.buffer)
    : null;
  const rawName = source?.title || file.originalname;
  const asset = await Asset.create({
    uid,
    repositoryId,
    type: assetType,
    storageKey: key,
    name: rawName,
    meta: {
      fileSize: file.size,
      mimeType: file.mimetype,
      extension: path.extname(file.originalname).replace('.', '').toLowerCase(),
      ...(dimensions && dimensions),
      ...(description && { description }),
      ...(tags?.length && { tags }),
      ...(source && { source }),
    },
    uploaderId: userId,
  });
  return asset.reload({ include: [UPLOADER_INCLUDE] });
}

async function destroyAsset(repository: any, asset: Asset) {
  logger.debug({ assetId: asset.id, type: asset.type }, 'Destroying asset');
  await safeRemoveFromVectorStore(repository, asset);
  // Files are NOT deleted from storage - content elements may reference them
  // via storage:// URIs. Only the library record is removed (soft-delete).
  await asset.destroy();
}

export async function list(repositoryId: number, options: ListOptions = {}) {
  const {
    search, type, offset = 0, limit = 100, signed = false,
    orderBy = 'createdAt', orderDirection = 'DESC',
    videoLinkMode,
  } = options;
  logger.debug(
    { repositoryId, search, type, videoLinkMode, offset, limit },
    'Listing assets',
  );
  const where: any = { repositoryId };
  if (videoLinkMode === VideoLinkMode.Include) {
    where[Op.and] = [{
      [Op.or]: [{ type: AssetType.Video }, IS_VIDEO_LINK],
    }];
  } else if (videoLinkMode === VideoLinkMode.Exclude) {
    where.type = AssetType.Link;
    Object.assign(where, IS_NOT_VIDEO_LINK);
  } else if (type) {
    where.type = Array.isArray(type) ? { [Op.in]: type } : type;
  }
  if (search) {
    // Escape LIKE wildcards (%, _) in Op.iLike values
    const escaped = search.replace(/[\\%_]/g, '\\$&');
    where.name = { [Op.iLike]: `%${escaped}%` };
  }
  const { rows, count } = await Asset.findAndCountAll({
    where,
    include: [UPLOADER_INCLUDE],
    order: [[orderBy, orderDirection]],
    offset,
    limit,
  });
  if (signed) await Asset.resolvePublicUrls(rows);
  return { items: rows, total: count };
}

export function upload(
  repositoryId: number,
  userId: number,
  files: MulterFile[],
) {
  return Promise.all(
    files.map((file) => importFile({ repositoryId, userId, file })),
  );
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
  file: MulterFile,
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
  await Storage.saveFile(storageKey, file.buffer);
  const files = { ...asset.meta?.files, [fileKey]: storageKey };
  return asset.update({ meta: { ...asset.meta, files } });
}

// Merges discovery metadata with OG-extracted attribution.
// Discovery values take precedence; OG fills gaps.
function mergeAttribution(
  url: string,
  meta: ImportFromLinkOptions,
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
  meta: ImportFromLinkOptions = {},
) {
  const domain = new URL(url).hostname;
  logger.debug(
    { repositoryId, url, contentType: meta.contentType },
    'Importing from link',
  );
  // OG scrape runs for all imports - enriches both file and link assets.
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
      return await importFile({
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
  const provider = meta.provider || detected.provider;
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
      ...(provider && { provider }),
      ...(tags.length && { tags }),
      ...(source && { source }),
      ...(meta.altText && { altText: meta.altText }),
    },
    uploaderId: userId,
  });
  return asset.reload({ include: [UPLOADER_INCLUDE] });
}

export async function remove(repository: any, asset: Asset) {
  await destroyAsset(repository, asset);
  return asset;
}

export async function bulkRemove(repository: any, assetIds: number[]) {
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
