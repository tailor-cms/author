/**
 * Asset indexing pipeline - uploads asset content to the OpenAI
 * vector store for AI-powered search and retrieval.
 *
 * Each asset type has a dedicated indexing strategy:
 * - document: uploads the binary file directly
 * - link: fetches page text, builds a synthetic markdown document
 * - image: describes via vision, builds a synthetic document
 * - video/audio/other: builds a synthetic document from metadata
 *
 * 'Synthetic documents' are markdown files constructed from asset
 * metadata (description, tags) and optionally fetched body text.
 * They give the vector store searchable content for assets that
 * aren't natively text (images, links without accessible content).
 */
import mime from 'mime-types';
import { Op } from 'sequelize';

import AIService from '#shared/ai/ai.service.ts';
import { createLogger } from '#logger';
import db from '#shared/database/index.js';
import {
  AssetType,
  ProcessingStatus,
  type Asset,
  type FileAsset,
  type LinkAsset,
} from '../asset.model.js';
import {
  buildSyntheticContent,
  hasUsefulDescription,
} from '../extraction/synthetic-content.ts';
import { fetchCaptionText } from '../extraction/video/captions.ts';
import { extractAndSaveImages } from '../extraction/pdf-media.ts';
import { extractAndStoreCaptions } from '../extraction/video/youtube-captions.ts';
import { describeWithVision } from '../extraction/vision-describe.ts';
import { fetchUrlContent } from '../extraction/web-content.ts';
import Storage from '../../repository/storage.js';

interface IndexingContext<T extends Asset = Asset> {
  storeId: string;
  asset: T;
}

type IndexStrategy = (ctx: IndexingContext) => Promise<string | null>;

// Assets stuck in processing longer than this are considered stale (10 min)
const STALE_THRESHOLD_MS = 10 * 60 * 1000;
const { Asset: AssetModel } = db;

const logger = createLogger('asset:indexing');

async function findOrCreateStore(repository: any): Promise<string> {
  const existing = repository.getVectorStoreId();
  if (existing) {
    logger.debug(
      { repositoryId: repository.id, storeId: existing },
      'Found existing store',
    );
    return existing;
  }
  const store = AIService.vectorStore;
  if (!store) throw new Error('StoreService not available');
  const storeId = await store.createStore();
  logger.debug(
    { repositoryId: repository.id, storeId },
    'Created new store',
  );
  const wasSet = await repository.setVectorStoreId(storeId);
  if (wasSet) return storeId;
  // Another request won the race; use their storeId,
  // clean up the orphaned store we just created
  await repository.reload();
  const existingId = repository.getVectorStoreId();
  if (!existingId) throw new Error('Failed to persist vector store ID');
  logger.debug(
    { repositoryId: repository.id, storeId: existingId },
    'Using store from concurrent request',
  );
  store.deleteStore(storeId).catch((err: any) =>
    logger.warn({ err, storeId }, 'Failed to clean up orphaned store'),
  );
  return existingId;
}

export async function removeFromStore(repository: any, asset: Asset) {
  if (!asset.vectorStoreFileId || !AIService.vectorStore) return;
  const storeId = repository.data?.$$?.ai?.storeId;
  if (!storeId) return;
  logger.debug(
    { storeId, assetId: asset.id, fileId: asset.vectorStoreFileId },
    'Removing file from store',
  );
  await AIService.vectorStore.remove(storeId, asset.vectorStoreFileId);
}

async function indexSynthetic(
  storeId: string,
  content: string,
  filename: string,
): Promise<string> {
  logger.debug({ storeId, filename }, 'Indexing synthetic document');
  const { fileId } = await AIService.vectorStore!.ingest(
    storeId,
    content,
    filename,
  );
  return fileId;
}

async function indexDocument(ctx: IndexingContext<FileAsset>) {
  const { storeId, asset } = ctx;
  logger.debug({ storeId, assetId: asset.id }, 'Indexing document');
  const buffer = await Storage.getFile(asset.storageKey);
  if (!buffer) {
    logger.warn({ assetId: asset.id }, 'Storage file missing');
    return null;
  }
  const file = {
    buffer,
    originalname: asset.name,
    mimetype: asset.meta.mimeType,
  };
  const result = await AIService.vectorStore!.upload(
    [file], storeId,
  );
  // Companion metadata doc so AI can discover this
  // document's asset ID via file_search
  const meta = buildSyntheticContent(asset);
  if (meta) {
    indexSynthetic(storeId, meta, `${asset.id}-meta.md`)
      .catch(() => {});
  }
  if (asset.meta.mimeType === mime.lookup('pdf')) {
    // Non-critical side effect - don't let image extraction fail the indexing
    extractAndSaveImages(asset, buffer).catch((err) =>
      logger.warn({ err, assetId: asset.id }, 'PDF image extraction failed'),
    );
  }
  return result.documents[0]?.fileId || null;
}

async function indexLink(ctx: IndexingContext<LinkAsset>) {
  const { asset } = ctx;
  const url = asset.meta.url;
  logger.debug({ assetId: asset.id, url }, 'Indexing link');
  // Returns captions for YT links, empty string for others
  let bodyText = '';
  try {
    bodyText = await extractAndStoreCaptions(asset);
  } catch (err) {
    logger.warn({ err, assetId: asset.id }, 'Caption extraction failed');
  }
  if (!bodyText) {
    try {
      bodyText = (await fetchUrlContent(url)).content;
    } catch (err) {
      logger.warn({ err }, `Failed to fetch content from ${url}`);
    }
  }
  const content = buildSyntheticContent(asset, bodyText);
  if (!content) return null;
  const { hostname } = new URL(url);
  return indexSynthetic(ctx.storeId, content, `${hostname}-${asset.id}.md`);
}

async function indexImage(ctx: IndexingContext) {
  const { storeId, asset } = ctx;
  logger.debug({ assetId: asset.id }, 'Indexing image');
  let description = '';
  if (hasUsefulDescription(asset)) {
    description = asset.meta.description || '';
  } else {
    try {
      description = await describeWithVision(asset);
    } catch (err: any) {
      logger.warn(
        { err: err.message, assetId: asset.id },
        'Vision describe failed',
      );
    }
  }
  const content = buildSyntheticContent(asset, description);
  if (!content) return null;
  return indexSynthetic(storeId, content, `${asset.name}.md`);
}

async function indexAudioVideo(ctx: IndexingContext) {
  const { storeId, asset } = ctx;
  logger.debug({ assetId: asset.id, type: asset.type }, 'Indexing audio/video');
  const captionText = await fetchCaptionText(asset);
  const content = buildSyntheticContent(asset, captionText);
  if (!content) return null;
  return indexSynthetic(storeId, content, `${asset.name}.md`);
}

async function indexDefault(ctx: IndexingContext) {
  const content = buildSyntheticContent(ctx.asset);
  if (!content) return null;
  return indexSynthetic(ctx.storeId, content, `${ctx.asset.name}.md`);
}

const indexByType: Partial<Record<AssetType, IndexStrategy>> = {
  [AssetType.Document]: indexDocument as IndexStrategy,
  [AssetType.Link]: indexLink as IndexStrategy,
  [AssetType.Video]: indexAudioVideo as IndexStrategy,
  [AssetType.Audio]: indexAudioVideo as IndexStrategy,
  [AssetType.Image]: indexImage as IndexStrategy,
};

async function setStatus(
  asset: Asset,
  status: ProcessingStatus | null,
  extra?: Record<string, unknown>,
) {
  return asset.update({ processingStatus: status, ...extra }).catch((err) => {
    logger.error({ err, assetId: asset.id, status }, 'Status update failed');
  });
}

// Claims an asset for processing via atomic status transition.
// Accepts any eligible state (null, Failed, stale Pending/Processing).
// Returns a fresh instance if claimed, null if another worker got there first.
async function claimAsset(assetId: number): Promise<Asset | null> {
  const [count] = await AssetModel.update(
    { processingStatus: ProcessingStatus.Processing },
    {
      where: {
        id: assetId,
        [Op.or]: [
          { processingStatus: { [Op.or]: [null, ProcessingStatus.Failed] } },
          {
            processingStatus: [
              ProcessingStatus.Pending,
              ProcessingStatus.Processing,
            ],
            updatedAt: { [Op.lt]: new Date(Date.now() - STALE_THRESHOLD_MS) },
          },
        ],
      },
    },
  );
  if (!count) return null;
  return AssetModel.findByPk(assetId);
}

async function processAssets(assetIds: number[], storeId: string) {
  if (!AIService.vectorStore) {
    logger.error('StoreService not available - AI not configured');
    return;
  }
  for (const id of assetIds) {
    const asset = await claimAsset(id);
    if (!asset) {
      logger.debug({ assetId: id }, 'Asset already claimed, skipping');
      continue;
    }
    try {
      const handler = indexByType[asset.type] || indexDefault;
      const fileId = await handler({ storeId, asset });
      await setStatus(
        asset,
        fileId ? ProcessingStatus.Completed : ProcessingStatus.Failed,
        fileId ? { vectorStoreFileId: fileId } : undefined,
      );
    } catch (err) {
      logger.error({ err, assetId: id }, 'Indexing failed');
      await setStatus(asset, ProcessingStatus.Failed);
    }
  }
}

export async function index(repository: any, assetIds: number[]) {
  const where = {
    id: { [Op.in]: assetIds },
    repositoryId: repository.id,
    [Op.or]: [
      { processingStatus: { [Op.or]: [null, ProcessingStatus.Failed] } },
      {
        processingStatus: [
          ProcessingStatus.Pending,
          ProcessingStatus.Processing,
        ],
        updatedAt: { [Op.lt]: new Date(Date.now() - STALE_THRESHOLD_MS) },
      },
    ],
  };
  const assets = await AssetModel.findAll({ where });
  if (!assets.length) {
    logger.info(
      { repositoryId: repository.id, assetIds },
      'No eligible assets to index',
    );
    return null;
  }
  const storeId = await findOrCreateStore(repository);
  const foundIds = assets.map((a: Asset) => a.id);
  logger.info(
    { repositoryId: repository.id, storeId, assetIds: foundIds },
    'Indexing started',
  );
  setImmediate(() => void processAssets(foundIds, storeId));
  return { storeId, assetIds: foundIds };
}

export function getStatus(repositoryId: number, assetId?: number) {
  logger.debug({ repositoryId, assetId }, 'Fetching indexing status');
  const where: Record<string, unknown> = {
    repositoryId,
    processingStatus: { [Op.not]: null },
  };
  if (assetId) where.id = assetId;
  return AssetModel.findAll({
    where,
    attributes: ['id', 'processingStatus', 'vectorStoreFileId'],
  });
}

export async function deindex(repository: any, asset: Asset) {
  logger.info(
    { repositoryId: repository.id, assetId: asset.id },
    'Deindexing asset',
  );
  // Always clear local status even if remote removal fails -
  // a stale vectorStoreFileId is harmless, but a stuck status blocks re-indexing
  try {
    await removeFromStore(repository, asset);
  } catch (err) {
    logger.warn({ err, assetId: asset.id }, 'Remote store removal failed');
  }
  return asset.update({
    processingStatus: null,
    vectorStoreFileId: null,
  });
}
