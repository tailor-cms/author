import { createLogger } from '#logger';
import db from '#shared/database/index.js';
import { downloadFile } from './utils/download.ts';
import { fetchOpenGraph } from './extraction/open-graph.ts';
import { Op } from 'sequelize';
import pick from 'lodash/pick.js';
import { randomUUID } from 'node:crypto';
import { removeFromStore } from './indexing/indexing.service.ts';
import Storage from '../repository/storage.js';

import { AssetType, type Asset, type AssetMeta } from './asset.model.js';
import type {
  ImportFileOptions,
  ImportFromLinkOptions,
  MulterFile,
} from './types.ts';
import type { ContentType } from '@tailor-cms/interfaces/discovery.ts';

const { Asset, User } = db;

export const uploaderInclude = {
  model: User,
  as: 'uploader',
  attributes: ['id', 'email', 'firstName', 'lastName', 'fullName', 'imgUrl'],
};

const logger = createLogger('asset');
const DOWNLOADABLE_TYPES: Set<ContentType> = new Set(['image', 'pdf', 'data']);
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

function resolveType(mimeType: string | undefined): AssetType {
  if (!mimeType) return AssetType.Other;
  for (const [type, prefixes] of Object.entries(MIME_CATEGORY_MAP)) {
    if (prefixes.some((p) => mimeType.startsWith(p))) return type as AssetType;
  }
  return AssetType.Other;
}

function buildStorageKey(repositoryId: number, uid: string, filename: string) {
  return `repository/${repositoryId}/assets/${uid}__${filename}`;
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
  source,
}: ImportFileOptions) {
  const uid = randomUUID();
  const key = buildStorageKey(repositoryId, uid, file.originalname);
  await Storage.saveFile(key, file.buffer);
  const asset = await Asset.create({
    uid,
    repositoryId,
    name: source?.title || file.originalname,
    type: resolveType(file.mimetype),
    storageKey: key,
    meta: {
      fileSize: file.size,
      mimeType: file.mimetype,
      ...(description && { description }),
      ...(source && { source }),
    },
    uploadedBy: userId,
  });
  return asset.reload({ include: [uploaderInclude] });
}

async function destroyAsset(repository: any, asset: Asset) {
  await safeRemoveFromVectorStore(repository, asset);
  if (asset.storageKey) await safeDeleteFile(asset.storageKey);
  const files = asset.meta?.files;
  if (files) {
    await Promise.all(Object.values(files).map(safeDeleteFile));
  }
  await asset.destroy();
}

export function list(repositoryId: number) {
  return Asset.findAll({
    where: { repositoryId },
    include: [uploaderInclude],
    order: [['createdAt', 'DESC']],
  });
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

export function getDownloadUrl(key: string) {
  return Storage.getFileUrl(key);
}

export async function updateMeta(asset: Asset, meta: Partial<AssetMeta>) {
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
    };
  }
  const asset = await Asset.create({
    uid: randomUUID(),
    repositoryId,
    name: ogData.title || domain,
    type: AssetType.Link,
    meta: { url, ...ogData },
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
