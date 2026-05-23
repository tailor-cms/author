// Summary cache for the outline context envelope.
// Backed by the shared Keyv KV adapter (in-memory dev, Redis prod).
//
// Key shape:
//   - Activity (leaf): `repo:${repoId}:a:${activityId}` - currently
//     the only kind of entry we write.
//   - Repo-level slot:  `repo:${repoId}` - reserved; the API supports
//     reads/writes here for future repo-scoped summaries even though
//     no caller uses it today.
// The shared `repo:${repoId}` prefix lets a per-repo wipe scan once;
// the `:a:` segment between repo and activity ids prevents collisions
// between an activity id and its repository id (both are independent
// Postgres serials and can coincide, e.g. activity #5 in repo #5).
//
// Freshness: every entry carries a freshnessKey (stringified
// modifiedAt).
//
// TTL (7 days): only garbage-collects orphaned keys (e.g.
// deleted activities). Correctness comes from freshnessKey.
import Keyv from 'keyv';
import { kvStore as kvConfig } from '#config';

const SUMMARY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Keyv namespace prefix.
const NAMESPACE = 'agent:ctx:summary';

export interface CachedSummary {
  // AI-generated summary text.
  text: string;
  // Stringified modifiedAt. Checked after fetch: if it
  // doesn't match the current value the entry is stale
  // and gets re-computed. modifiedAt bubbles up from all
  // descendant changes via hooks.
  freshnessKey: string;
  // Unix ms when this summary was generated.
  computedAt: number;
}

/**
 * AI-generated summaries with freshness validation via modifiedAt.
 * Keys distinguish two slot kinds via an `:a:` segment so an activity
 * id can't collide with its repository's id:
 *  - Activity (leaf) summary: `repo:${repoId}:a:${activityId}` (in use)
 *  - Repo-level slot:         `repo:${repoId}`                 (reserved)
 *
 * @example
 * await summaryStore.set(5, 42, 'Covers variables...', '1719...');
 * const leaf = await summaryStore.get(5, 42, '1719...');
 * await summaryStore.invalidate(5, 42);
 */
class SummaryStore {
  private readonly store: Keyv<CachedSummary>;

  constructor() {
    this.store = new Keyv<CachedSummary>({
      ...kvConfig.keyvDefaultConfig,
      namespace: NAMESPACE,
      ttl: SUMMARY_TTL_MS,
    });
    this.store.on('error', (err) =>
      console.warn(`[${NAMESPACE}]`, err?.message ?? err),
    );
  }

  async get(
    repoId: number,
    ...args:
      | [activityId: number, freshnessKey: string]
      | [freshnessKey: string]
  ): Promise<CachedSummary | null> {
    const isLeaf = args.length === 2;
    const cacheKey = isLeaf
      ? this.activityKey(repoId, args[0] as number)
      : this.repoKey(repoId);
    const freshnessKey = isLeaf ? args[1] as string : args[0];
    const cached = await this.store.get(cacheKey);
    if (!cached || cached.freshnessKey !== freshnessKey) return null;
    return cached;
  }

  async set(
    repoId: number,
    ...args:
      | [activityId: number, text: string, freshnessKey: string]
      | [text: string, freshnessKey: string]
  ): Promise<void> {
    const isLeaf = args.length === 3;
    const cacheKey = isLeaf
      ? this.activityKey(repoId, args[0] as number)
      : this.repoKey(repoId);
    const text = isLeaf ? args[1] as string : args[0] as string;
    const freshnessKey = isLeaf ? args[2] as string : args[1] as string;
    await this.store.set(cacheKey, {
      text,
      freshnessKey,
      computedAt: Date.now(),
    });
  }

  async invalidate(
    repoId: number,
    ...args: [activityId: number] | []
  ): Promise<void> {
    const cacheKey = args.length
      ? this.activityKey(repoId, args[0])
      : this.repoKey(repoId);
    await this.store.delete(cacheKey);
  }

  /**
   * Drop every cached entry for a repository - both the leaf
   * summaries (`repo:N:a:*`) and the reserved repo-level slot
   * (`repo:N`) if anything ever uses it. Requires the underlying
   * Keyv store to support iteration (Redis does; in-memory Map may
   * not - in that case this is a no-op).
   */
  async invalidateRepository(repoId: number): Promise<void> {
    const iterator = (this.store as any).iterator?.();
    if (!iterator) return;
    // Match either the exact repo overview key (`repo:5`) or anything
    // that lives under it (`repo:5:a:42`). Without the trailing-colon
    // check we'd false-positive `repo:50` when wiping repo 5.
    const overviewKey = this.repoKey(repoId);
    const childPrefix = `${overviewKey}:`;
    const matchedKeys: string[] = [];
    for await (const [key] of iterator) {
      if (typeof key !== 'string') continue;
      if (key === overviewKey || key.startsWith(childPrefix)) {
        matchedKeys.push(key);
      }
    }
    await Promise.all(matchedKeys.map((key) => this.store.delete(key)));
  }

  private activityKey(repoId: number, activityId: number) {
    return `${this.repoKey(repoId)}:a:${activityId}`;
  }

  private repoKey(repoId: number) {
    return `repo:${repoId}`;
  }
}

export const summaryStore = new SummaryStore();
