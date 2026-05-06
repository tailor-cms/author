/**
 * Describe and grade an image asset using GPT-4o vision.
 * Returns the full grading result (or null when vision is
 * unavailable / cannot reach the asset). Updates the asset
 * meta with description, tags, quality grade, relevance
 * score, content suggestion, and isInformative flag.
 */
import type { ImageDescription } from '@tailor-cms/interfaces/ai.ts';
import AIService from '#shared/ai/ai.service.ts';
import { createLogger } from '#logger';

import Storage from '../../repository/storage.js';

const logger = createLogger('asset:vision-describe');

export async function describeWithVision(
  asset: any,
): Promise<ImageDescription | null> {
  if (!asset.storageKey || !AIService.describeImage) return null;
  const publicUrl = await Storage.getFileUrl(asset.storageKey);
  if (!publicUrl) return null;
  const result = await AIService.describeImage(publicUrl);
  await asset.update({
    meta: {
      ...asset.meta,
      description: result.description,
      analysis: result.analysis,
      quality: result.quality,
      qualityIssues: result.qualityIssues,
      relevanceScore: result.relevanceScore,
      contentSuggestion: result.contentSuggestion,
      isInformative: result.isInformative,
      tags: [...(asset.meta?.tags || []), ...result.tags],
    },
  });
  logger.info(
    {
      assetId: asset.id,
      quality: result.quality,
      relevance: result.relevanceScore,
      isInformative: result.isInformative,
    },
    'Vision graded image',
  );
  return result;
}
