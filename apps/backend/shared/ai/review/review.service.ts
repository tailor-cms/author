// Orchestrates feedback reviews: freshness checks, run locking, the
// background analysis run, and status projection for the endpoints.
// Scoring rubrics come from the config package (config/src/rubrics).
import type { ScoringRubric } from '@tailor-cms/interfaces/feedback';
import { feedback as feedbackConfig } from '@tailor-cms/config';

import type { FeedbackStatus } from './schemas/index.ts';
import { createAiLogger } from '../logger.ts';
import { reviewRunner } from './ReviewRunner.ts';
import { reviewStore, type ReviewEntry } from './store.ts';

const logger = createAiLogger('review.service');

export class ReviewDisabledError extends Error {
  constructor() {
    super('Review is disabled for this repository');
    this.name = 'ReviewDisabledError';
  }
}

export class RubricNotEnabledError extends Error {
  constructor() {
    super('Scoring rubric is not enabled for this repository');
    this.name = 'RubricNotEnabledError';
  }
}

interface AnalysisContext {
  repository: any;
  activity: any;
  userId: number;
  rubric: ScoringRubric;
}

class FeedbackService {
  async getStatus(
    repository: any,
    activity: any,
    rubricId?: string,
  ): Promise<FeedbackStatus> {
    const rubric = this.resolveRubric(repository.schema, rubricId);
    const [entry, isRunning] = await Promise.all([
      reviewStore.get(activity, rubric.id),
      reviewStore.isRunning(activity, rubric.id),
    ]);
    return this.toStatus(entry, isRunning, signatureOf(activity));
  }

  /**
   * Trigger an analysis unless one is already running or the cached
   * result matches the current content signature. Failed attempts are
   * not auto-retried for the same signature - only `force` (the
   * manual refresh) re-runs those. The run itself happens in the
   * background; the returned status is what the caller shows
   * immediately.
   */
  async requestAnalysis(
    repository: any,
    activity: any,
    userId: number,
    rubricId?: string,
    force = false,
  ): Promise<FeedbackStatus> {
    const rubric = this.resolveRubric(repository.schema, rubricId);
    const freshnessKey = signatureOf(activity);
    const entry = await reviewStore.get(activity, rubric.id);
    if (!force && isCurrent(entry, freshnessKey)) {
      return this.getStatus(repository, activity, rubric.id);
    }
    const acquired = await reviewStore.acquireLock(activity, rubric.id);
    const context = { repository, activity, userId, rubric };
    if (acquired) void this.analyze(context, freshnessKey);
    return this.toStatus(entry, true, freshnessKey);
  }

  /**
   * Resolve the scoring rubric for a request.
   */
  private resolveRubric(schemaId: string, rubricId?: string): ScoringRubric {
    const config = feedbackConfig.resolveConfig(schemaId);
    if (!config.isEnabled) throw new ReviewDisabledError();
    const rubric = rubricId
      ? config.rubrics.find((it) => it.id === rubricId)
      : config.rubrics[0];
    if (!rubric) throw new RubricNotEnabledError();
    return rubric;
  }

  private async analyze(
    context: AnalysisContext,
    freshnessKey: string,
  ): Promise<void> {
    const { repository, userId, activity, rubric } = context;
    const meta = {
      repositoryId: repository.id,
      activityId: activity.id,
      rubricId: rubric.id,
    };
    logger.info(meta, '> feedback analysis');
    try {
      const result = await reviewRunner.run({
        repository,
        userId,
        activity,
        rubric,
        freshnessKey,
      });
      await reviewStore.saveResult(activity, result);
      logger.info(
        { ...meta, score: result.overall.score },
        '< feedback analysis done',
      );
    } catch (err: any) {
      logger.error({ ...meta, err }, '< feedback analysis failed');
      await reviewStore.saveFailure(
        activity,
        rubric.id,
        freshnessKey,
        err.message,
      );
    } finally {
      await reviewStore.releaseLock(activity, rubric.id);
    }
  }

  private toStatus(
    entry: ReviewEntry | null,
    isRunning: boolean,
    freshnessKey: string,
  ): FeedbackStatus {
    return {
      status: isRunning ? 'running' : entry?.status ?? 'empty',
      isStale:
        !!entry?.result && entry.result.contentSignature !== freshnessKey,
      result: entry?.result ?? null,
      trend: entry?.trend ?? [],
      error: (!isRunning && entry?.status === 'failed' && entry.error) || null,
    };
  }
}

/**
 * Content signature for an activity - stringified `modifiedAt`, which
 * aggregates the latest change anywhere in the activity's subtree.
 */
function signatureOf(activity: any): string {
  const modifiedAt = activity.modifiedAt ?? activity.updatedAt;
  return String(new Date(modifiedAt).getTime());
}

// An entry is current when its last attempt (success or failure)
// already covers this content signature.
function isCurrent(entry: ReviewEntry | null, freshnessKey: string): boolean {
  if (!entry) return false;
  if (entry.status === 'ready') {
    return entry.result?.contentSignature === freshnessKey;
  }
  return entry.freshnessKey === freshnessKey;
}

export const reviewService = new FeedbackService();
