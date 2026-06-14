// KV cache for AI content reviews, modeled on the agent SummaryStore.
//
// Key shape: `repo:${repoId}:a:${activityId}:r:${rubricId}` - the `:a:` /
// `:r:` segments prevent collisions between independent serial ids.
//
// Freshness: entries carry the freshnessKey (stringified activity
// `modifiedAt`, which bubbles up from all subtree changes) they were
// computed against. Stale entries are still served - the sidebar shows
// the last review with a stale indicator - so reads never validate,
// callers compare signatures themselves.
//
// Locking: a short-TTL lock key serializes runs per (activity, rubric).
// Keyv has no atomic check-and-set, so two near-simultaneous triggers
// can theoretically both pass the check; the worst case is one wasted
// duplicate run, which the freshness check upstream makes rare.
import type { FeedbackResult, TrendPoint } from './schemas/index.ts';
import type Keyv from 'keyv';
import { createKvStore } from '#shared/kvStore.ts';

const NAMESPACE = 'ai:review';

// Garbage collection only - correctness comes from the freshness key.
const ENTRY_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Upper bound on a single analysis run; an orphaned lock (crashed run)
// unblocks itself after this.
const LOCK_TTL_MS = 3 * 60 * 1000;

// Snapshots kept for the sidebar's progress-over-time display.
const TREND_LIMIT = 6;

/**
 * The reviewed activity, structurally typed; the activity row carries
 * both ids the cache key needs, so callers cannot pass a mismatched
 * (repository, activity) pair.
 */
export interface ReviewTarget {
  id: number;
  repositoryId: number;
}

export interface ReviewEntry {
  status: 'ready' | 'failed';
  // Last successful review; preserved across failed re-runs
  result: FeedbackResult | null;
  // Recent score snapshots, oldest first, current result included
  trend: TrendPoint[];
  // Freshness key of the last attempt (successful or not)
  freshnessKey: string;
  // Failure message of the last attempt, when status is 'failed'
  error: string | null;
  // Unix ms of the last attempt
  computedAt: number;
}

class ReviewStore {
  private readonly store: Keyv<ReviewEntry>;
  private readonly locks: Keyv<number>;

  constructor() {
    this.store = createKvStore<ReviewEntry>({
      namespace: NAMESPACE,
      ttl: ENTRY_TTL_MS,
    });
    this.locks = createKvStore<number>({
      namespace: `${NAMESPACE}:lock`,
      ttl: LOCK_TTL_MS,
    });
    const warn = (err: any) =>
      console.warn(`[${NAMESPACE}]`, err?.message ?? err);
    this.store.on('error', warn);
    this.locks.on('error', warn);
  }

  async get(
    activity: ReviewTarget,
    rubricId: string,
  ): Promise<ReviewEntry | null> {
    return (await this.store.get(this.key(activity, rubricId))) ?? null;
  }

  /**
   * Persist a successful review and append its score snapshot to the
   * trend ring, dropping the oldest point past the cap.
   */
  async saveResult(
    activity: ReviewTarget,
    result: FeedbackResult,
  ): Promise<ReviewEntry> {
    const existing = await this.get(activity, result.rubricId);
    const trend = [...(existing?.trend ?? []), toTrendPoint(result)]
      .slice(-TREND_LIMIT);
    const entry: ReviewEntry = {
      status: 'ready',
      result,
      error: null,
      freshnessKey: result.contentSignature,
      computedAt: result.computedAt,
      trend,
    };
    await this.store.set(this.key(activity, result.rubricId), entry);
    return entry;
  }

  /**
   * Record a failed attempt while keeping the last successful review
   * (and its trend) available for display. The attempt's freshness key
   * is stored so the same content version is not retried automatically.
   */
  async saveFailure(
    activity: ReviewTarget,
    rubricId: string,
    freshnessKey: string,
    error: string,
  ): Promise<ReviewEntry> {
    const existing = await this.get(activity, rubricId);
    const entry: ReviewEntry = {
      status: 'failed',
      result: existing?.result ?? null,
      error,
      freshnessKey,
      computedAt: Date.now(),
      trend: existing?.trend ?? [],
    };
    await this.store.set(this.key(activity, rubricId), entry);
    return entry;
  }

  async isRunning(activity: ReviewTarget, rubricId: string): Promise<boolean> {
    return !!(await this.locks.get(this.key(activity, rubricId)));
  }

  async acquireLock(
    activity: ReviewTarget,
    rubricId: string,
  ): Promise<boolean> {
    const key = this.key(activity, rubricId);
    if (await this.locks.get(key)) return false;
    await this.locks.set(key, Date.now());
    return true;
  }

  async releaseLock(activity: ReviewTarget, rubricId: string): Promise<void> {
    await this.locks.delete(this.key(activity, rubricId));
  }

  private key(activity: ReviewTarget, rubricId: string) {
    return `repo:${activity.repositoryId}:a:${activity.id}:r:${rubricId}`;
  }
}

function toTrendPoint(res: FeedbackResult): TrendPoint {
  return {
    computedAt: res.computedAt,
    score: res.overall.score,
    maxScore: res.overall.maxScore,
    dimensions: Object.fromEntries(res.dimensions.map((it) => [it.key, it.score])),
  };
}

export const reviewStore = new ReviewStore();
