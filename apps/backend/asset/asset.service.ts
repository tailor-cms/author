import path from 'node:path';
import { randomUUID } from 'node:crypto';

import type { ContentType } from '@tailor-cms/interfaces/discovery.ts';
import { detectLinkProvider } from '@tailor-cms/common/asset';
import imageSize from 'image-size';
import { Op } from 'sequelize';
import pick from 'lodash/pick.js';

import { createLogger } from '#logger';
import { storage as storageConfig } from '#config';
import db from '#shared/database/index.js';

import { AssetType, type Asset, type AssetMeta } from './asset.model.js';
import { buildStorageKey } from './utils/storage-key.ts';
import { downloadFile } from './utils/download.ts';
import { fetchOpenGraph } from './extraction/open-graph.ts';
import { removeFromStore } from './indexing/indexing.service.ts';
import Storage from '../repository/storage.js';
import type {
  ImportFileOptions,
  ImportFromLinkOptions,
  MulterFile,
} from './types.ts';

const { Asset, User } = db;

// Asset name column is STRING (255 chars in PostgreSQL).
// Cap at 250 to leave room for the ellipsis suffix.
function truncateName(rawName: string, max = 250): string {
  return rawName.length > max
    ? `${rawName.slice(0, max - 3)}...`
    : rawName;
}

// Postgres iregexp pattern for video provider URL filtering.
// Used by Sequelize queries to classify link assets with video-provider
// URLs (YouTube, Vimeo, Dailymotion) under the video filter.
const VIDEO_URL_PATTERN =
  '(youtube\\.com|youtu\\.be|vimeo\\.com|dailymotion\\.com)';

// Controls how video-provider links (YouTube, Vimeo) are classified
export const VideoLinkMode = {
  // Show video-provider links under the video filter
  Include: 'include',
  // Hide video-provider links from the link filter
  Exclude: 'exclude',
} as const;

type VideoLinkMode = (typeof VideoLinkMode)[keyof typeof VideoLinkMode];

interface ListOptions {
  search?: string;
  type?: string | string[];
  offset?: number;
  limit?: number;
  signed?: boolean;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  // How to handle link assets with video provider URLs
  // 'include': merge them into video results (for video filter)
  // 'exclude': remove them from link results (for link filter)
  // undefined: no special handling (default)
  videoLinkMode?: VideoLinkMode;
}

export const uploaderInclude = {
  model: User,
  as: 'uploader',
  attributes: ['id', 'email', 'firstName', 'lastName', 'fullName', 'imgUrl'],
};

const logger = createLogger('asset');

const DOWNLOADABLE_TYPES: Set<ContentType> = new Set(['image', 'pdf']);
const MIME_CATEGORY_MAP: Record<string, string[]> = {
  image: ['image/'],
  video: ['video/'],
  audio: ['audio/'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'text/plain',
    'text/csv',
    'text/markdown',
    'text/html',
    'application/rtf',
  ],
};

const VIDEO_LINK_WHERE: Record<string, any> = {
  type: AssetType.Link,
};
VIDEO_LINK_WHERE['meta.url'] = {
  [Op.iRegexp]: VIDEO_URL_PATTERN,
};

const NOT_VIDEO_LINK_WHERE: Record<string, any> = {};
NOT_VIDEO_LINK_WHERE['meta.url'] = {
  [Op.notIRegexp]: VIDEO_URL_PATTERN,
};

function resolveType(mimeType: string | undefined): AssetType {
  if (!mimeType) return AssetType.Other;
  for (const [type, prefixes] of Object.entries(MIME_CATEGORY_MAP)) {
    if (prefixes.some((p) => mimeType.startsWith(p))) return type as AssetType;
  }
  return AssetType.Other;
}

/** Wraps an async fn so it logs warnings instead of throwing. */
function safe(fn: (...args: any[]) => Promise<any>) {
  return (...args: any[]) =>
    fn(...args).catch((err) => {
      logger.warn({ err }, `${fn.name || 'cleanup'} failed`);
    });
}

const safeRemoveFromVectorStore = safe(removeFromStore);
const safeDeleteFile = safe(Storage.deleteFile.bind(Storage));

async function importFile({
  repositoryId,
  userId,
  file,
  description,
  tags,
  source,
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
  let dimensions: { width?: number; height?: number } = {};
  if (assetType === AssetType.Image && file.buffer) {
    try {
      const result = imageSize(file.buffer);
      if (result.width && result.height) {
        dimensions = { width: result.width, height: result.height };
      }
    } catch { /* non-critical — skip dimensions */ }
  }
  const rawName = source?.title || file.originalname;
  const asset = await Asset.create({
    uid,
    repositoryId,
    name: truncateName(rawName),
    type: assetType,
    storageKey: key,
    meta: {
      fileSize: file.size,
      mimeType: file.mimetype,
      extension: path.extname(file.originalname).replace('.', '').toLowerCase(),
      ...(dimensions.width && dimensions),
      ...(description && { description }),
      ...(tags?.length && { tags }),
      ...(source && { source }),
    },
    uploadedBy: userId,
  });
  return asset.reload({ include: [uploaderInclude] });
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
      [Op.or]: [
        { type: AssetType.Video },
        VIDEO_LINK_WHERE,
      ],
    }];
  } else if (videoLinkMode === VideoLinkMode.Exclude) {
    where.type = AssetType.Link;
    Object.assign(where, NOT_VIDEO_LINK_WHERE);
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
    include: [uploaderInclude],
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
  // Clean up stored files for any file key being removed
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
  const oldKey = asset.meta?.files?.[fileKey];
  if (oldKey) await safeDeleteFile(oldKey);
  const storageKey = `${asset.storageKey}__${fileKey}__${file.originalname}`;
  await Storage.saveFile(storageKey, file.buffer);
  const files = { ...asset.meta?.files, [fileKey]: storageKey };
  return asset.update({ meta: { ...asset.meta, files } });
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
  // Downloadable types: fetch the file and store it like a regular upload.
  if (meta.contentType && DOWNLOADABLE_TYPES.has(meta.contentType)) {
    try {
      const file = await downloadFile(meta.downloadUrl || url);
      const source = {
        url,
        domain,
        ...pick(meta, ['title', 'author', 'license']),
      };
      return await importFile({
        repositoryId,
        userId,
        file,
        description: meta.description,
        tags: meta.tags,
        source,
      });
    } catch (err) {
      logger.warn(
        { err, url },
        'File download failed, falling back to link import',
      );
    }
  }
  // Default: create as a link asset with OG metadata.
  let ogData;
  try {
    ogData = await fetchOpenGraph(url);
  } catch {
    ogData = {
      title: domain,
      description: '',
      thumbnail: '',
      favicon: '',
      domain,
      siteName: '',
      ogType: '',
      author: '',
      tags: [] as string[],
      license: '',
    };
  }
  // Separate attribution fields from display metadata before spreading.
  // Display fields (title, thumbnail, etc.) go into meta directly;
  // attribution flows into `source` and `tags` explicitly.
  const {
    author: ogAuthor, tags: ogTags, license: ogLicense, ...ogMeta
  } = ogData;
  // Caller-provided values (from discovery) take precedence over OG-extracted
  const author = meta.author || ogAuthor;
  const license = meta.license || ogLicense;
  const source = (meta.contentType || author || license)
    ? {
        url,
        domain,
        ...(meta.title && { title: meta.title }),
        ...(author && { author }),
        ...(license && { license }),
      }
    : undefined;
  // Merge caller tags with OG-extracted tags, deduped
  const tags = [...new Set([...(meta.tags || []), ...ogTags])];
  // Auto-detect provider and content type from URL (YouTube, Vimeo, etc.)
  const detected = detectLinkProvider(url);
  const contentType = meta.contentType || detected.contentType;
  const provider = meta.provider || detected.provider;
  const rawName = meta.title || ogData.title || domain;
  const asset = await Asset.create({
    uid: randomUUID(),
    repositoryId,
    name: truncateName(rawName),
    type: AssetType.Link,
    meta: {
      url, ...ogMeta,
      ...(contentType && { contentType }),
      ...(provider && { provider }),
      ...(tags.length && { tags }),
      ...(source && { source }),
    },
    uploadedBy: userId,
  });
  return asset.reload({ include: [uploaderInclude] });
}

export async function remove(repository: any, asset: Asset) {
  await destroyAsset(repository, asset);
  return asset;
}

export async function bulkRemove(repository: any, assetIds: number[]) {
  const assets = await Asset.findAll({
    where: { id: { [Op.in]: assetIds }, repositoryId: repository.id },
  });
  await Promise.all(assets.map((it: Asset) => destroyAsset(repository, it)));
  return assets.map((a: Asset) => a.id);
}
