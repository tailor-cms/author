/**
 * Describe and grade an image asset using GPT-4o vision.
 * Returns the generated description (empty string if unavailable).
 * Updates the asset meta with description, tags, quality grade,
 * relevance score, and content suggestion.
 */
import AIService from '#shared/ai/ai.service.ts';
import { createLogger } from '#logger';

import Storage from '../../repository/storage.js';

const logger = createLogger('asset:vision-describe');

export async function describeWithVision(
  asset: any,
): Promise<string> {
  if (!asset.storageKey || !AIService.describeImage) return '';
  const publicUrl = await Storage.getFileUrl(asset.storageKey);
  if (!publicUrl) return '';
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
      tags: [...(asset.meta?.tags || []), ...result.tags],
    },
  });
  logger.info(
    { assetId: asset.id, quality: result.quality, relevance: result.relevanceScore },
    'Vision graded image',
  );
  return result.description;
}
