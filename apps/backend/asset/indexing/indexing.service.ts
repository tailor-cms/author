/**
 * Asset indexing pipeline - uploads asset content to the OpenAI
 * vector store for AI-powered search and retrieval.
 *
 * Each asset type has a dedicated indexing strategy:
 * - document: uploads the binary file directly
 * - link: fetches page text, builds a synthetic markdown document
 * - image/video/audio/other: builds a synthetic document from metadata
 *
 * 'Synthetic documents' are markdown files constructed from asset
 * metadata (description, tags) and optionally fetched body text.
 * They give the vector store searchable content for assets that
 * aren't natively text (images, links without accessible content).
 */
import {
  AssetType,
  ProcessingStatus,
  type Asset,
  type FileAsset,
  type LinkAsset,
} from '../asset.model.js';
import {
  buildSyntheticContent,
  fetchCaptionText,
} from '../extraction/synthetic-content.ts';
import AIService from '#shared/ai/ai.service.ts';
import { createLogger } from '#logger';
import db from '#shared/database/index.js';
import { fetchUrlContent } from '../extraction/web-content.ts';
import { Op } from 'sequelize';
import Storage from '../../repository/storage.js';

interface IndexingContext<T extends Asset = Asset> {
  storeId: string;
  asset: T;
}

type IndexStrategy = (ctx: IndexingContext) => Promise<string | null>;

// Assets stuck in Pending/Processing longer than this are considered stale (10 min)
const STALE_THRESHOLD_MS = 10 * 60 * 1000;
const { Asset: AssetModel } = db;

const logger = createLogger('asset:indexing');

async function findOrCreateStore(repository: any): Promise<string> {
  const existing = repository.data?.$$?.ai?.storeId;
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
  logger.debug({ repositoryId: repository.id, storeId }, 'Created new store');
  const $$ = {
    ...repository.data?.$$,
    ai: { ...repository.data?.$$?.ai, storeId },
  };
  await repository.update({ data: { ...repository.data, $$ } });
  return storeId;
}

export async function removeFromStore(repository: any, asset: Asset) {
  if (!asset.vectorStoreFileId || !AIService.vectorStore) return;
  const storeId = repository.data?.$$?.ai?.storeId;
  if (!storeId) return;
  logger.debug(
    { storeId, assetId: asset.id, fileId: asset.vectorStoreFileId },
    'Removing file from store',
  );
  await AIService.vectorStore.removeFile(storeId, asset.vectorStoreFileId);
}

async function indexSynthetic(
  storeId: string,
  content: string,
  filename: string,
): Promise<string> {
  logger.debug({ storeId, filename }, 'Indexing synthetic document');
  const { fileId } = await AIService.vectorStore!.uploadSyntheticDocument(
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
    logger.warn(
      { assetId: asset.id, storageKey: asset.storageKey },
      'Storage file missing',
    );
    return null;
  }
  const file = {
    buffer,
    originalname: asset.name,
    mimetype: asset.meta.mimeType,
  };
  const result = await AIService.vectorStore!.upload([file], storeId);
  return result.documents[0]?.fileId || null;
}

async function indexLink(ctx: IndexingContext<LinkAsset>) {
  const { asset } = ctx;
  logger.debug({ assetId: asset.id, url: asset.meta.url }, 'Indexing link');
  let bodyText = '';
  try {
    const extracted = await fetchUrlContent(asset.meta.url);
    bodyText = extracted.content;
  } catch (err) {
    logger.warn({ err }, `Failed to fetch content from ${asset.meta.url}`);
  }
  const content = buildSyntheticContent(asset, bodyText);
  if (!content) return null;
  const { hostname } = new URL(asset.meta.url);
  return indexSynthetic(ctx.storeId, content, `${hostname}-${asset.id}.md`);
}

async function indexMedia(ctx: IndexingContext) {
  const { storeId, asset } = ctx;
  logger.debug({ assetId: asset.id, type: asset.type }, 'Indexing media');
  const captionText = await fetchCaptionText(asset);
  const content = buildSyntheticContent(asset, captionText);
  if (!content) return null;
  return indexSynthetic(storeId, content, `${asset.name}.md`);
}

async function indexDefault(ctx: IndexingContext) {
  const { storeId, asset } = ctx;
  logger.debug({ assetId: asset.id, type: asset.type }, 'Indexing default');
  const content = buildSyntheticContent(asset);
  if (!content) return null;
  return indexSynthetic(storeId, content, `${asset.name}.md`);
}

const indexByType: Partial<Record<AssetType, IndexStrategy>> = {
  [AssetType.Document]: indexDocument as IndexStrategy,
  [AssetType.Link]: indexLink as IndexStrategy,
  [AssetType.Video]: indexMedia as IndexStrategy,
  [AssetType.Audio]: indexMedia as IndexStrategy,
};

async function setStatus(
  asset: Asset,
  status: ProcessingStatus | null,
  extra?: Record<string, unknown>,
) {
  return asset.update({ processingStatus: status, ...extra }).catch((err) => {
    logger.error(
      { err, assetId: asset.id, status },
      'Failed to update processing status',
    );
  });
}

async function processAssets(assets: Asset[], storeId: string): Promise<void> {
  if (!AIService.vectorStore) {
    logger.error('StoreService not available - AI not configured');
    return;
  }
  for (const asset of assets) {
    try {
      await setStatus(asset, ProcessingStatus.Processing);
      const handler = indexByType[asset.type] || indexDefault;
      const fileId = await handler({ storeId, asset });
      await setStatus(
        asset,
        fileId ? ProcessingStatus.Completed : ProcessingStatus.Failed,
        fileId ? { vectorStoreFileId: fileId } : undefined,
      );
    } catch (err) {
      logger.error({ err, assetId: asset.id }, 'Failed to index asset');
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
        processingStatus: [ProcessingStatus.Pending, ProcessingStatus.Processing],
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
  await AssetModel.update(
    { processingStatus: ProcessingStatus.Pending },
    { where: { id: { [Op.in]: foundIds } } },
  );
  logger.info(
    { repositoryId: repository.id, storeId, assetIds: foundIds },
    'Indexing started',
  );
  setImmediate(() => void processAssets(assets, storeId));
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
  await removeFromStore(repository, asset);
  return asset.update({ processingStatus: null, vectorStoreFileId: null });
}
