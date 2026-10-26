import type { Message } from '@tailor-cms/interfaces/comment';
import type { MessageCache } from './messageCache';

import { map } from 'lodash-es';

// Messages per request; a full page means more may remain past it
export const PAGE_SIZE = 50;
// How much of a page around a message comes before it, as the server
// splits it
const PAGE_BEFORE = Math.floor(PAGE_SIZE / 2);

export interface PageQuery {
  before?: number;
  after?: number;
  around?: number;
}

type FetchPage = (query?: PageQuery) => Promise<unknown>;

// Loading more at one end of a list, in VInfiniteScroll's terms: more to
// load, loading, failed, or the end reached
export const PagingStatus = {
  Ok: 'ok',
  Loading: 'loading',
  Error: 'error',
  Empty: 'empty',
} as const;

export type PagingStatus = (typeof PagingStatus)[keyof typeof PagingStatus];

// Where a list stands at either end
export interface Paging {
  older: PagingStatus;
  newer: PagingStatus;
}

// Nothing more at either end
export const NO_PAGING: Paging = {
  older: PagingStatus.Empty,
  newer: PagingStatus.Empty,
};

// One end of the lists: those with more on the server past it, loading
// it, or whose last request for it failed
const createEnd = () => ({
  withMore: reactive(new Set<number>()),
  loading: reactive(new Set<number>()),
  failed: reactive(new Set<number>()),
});

type End = ReturnType<typeof createEnd>;

/**
 * Message lists read a page at a time; one per thread or reply chain,
 * keyed by its id. A list starts at the newest page, or around an older
 * message, where it stops short of the newest until scrolled down to.
 */
export const createMessagePages = (messageCache: MessageCache) => {
  const older = createEnd();
  const newer = createEnd();

  const endStatus = (end: End, key?: number | null): PagingStatus => {
    if (!key || !end.withMore.has(key)) return PagingStatus.Empty;
    if (end.loading.has(key)) return PagingStatus.Loading;
    return end.failed.has(key) ? PagingStatus.Error : PagingStatus.Ok;
  };

  const paging = (key?: number | null): Paging => ({
    older: endStatus(older, key),
    newer: endStatus(newer, key),
  });
  // Stops short of the newest messages
  const hasNewer = (key?: number | null) => !!key && newer.withMore.has(key);

  // A full side means more may remain past it
  function track(end: End, key: number, count: number, size = PAGE_SIZE) {
    end.failed.delete(key);
    if (count >= size) end.withMore.add(key);
    else end.withMore.delete(key);
  }

  // The newest page, or the one around the `at` message
  async function fetchLatest(
    key: number,
    fetchPage: FetchPage,
    at?: number | null,
  ) {
    const page = (await fetchPage(at ? { around: at } : {})) as Message[];
    const beforeCount = at ? page.filter((it) => it.id < at).length : 0;
    if (at) {
      track(older, key, beforeCount, PAGE_BEFORE);
      track(newer, key, page.length - beforeCount, PAGE_SIZE - PAGE_BEFORE);
    } else {
      track(older, key, page.length);
      track(newer, key, 0);
    }
    return page;
  }

  // Adds the page past the loaded end of `ids`; a failure is kept, for
  // the list to offer a retry
  async function loadMore(
    ids: Map<number, number[]>,
    key: number,
    fetchPage: FetchPage,
    isNewer: boolean,
  ) {
    const end = isNewer ? newer : older;
    const edgeOf = (list?: number[]) => (isNewer ? list?.at(-1) : list?.[0]);
    const edge = edgeOf(ids.get(key));
    if (!edge || !end.withMore.has(key) || end.loading.has(key)) return;
    end.loading.add(key);
    end.failed.delete(key);
    try {
      const query = isNewer ? { after: edge } : { before: edge };
      const page = (await fetchPage(query)) as Message[];
      const loaded = ids.get(key);
      // Reloaded meanwhile
      if (!loaded || edgeOf(loaded) !== edge) return;
      track(end, key, page.length);
      const added = map(page.map((it) => messageCache.setLocal(it)), 'id');
      ids.set(key, isNewer ? [...loaded, ...added] : [...added, ...loaded]);
    } catch {
      end.failed.add(key);
    } finally {
      end.loading.delete(key);
    }
  }

  const loadOlder = (
    ids: Map<number, number[]>,
    key: number,
    fetchPage: FetchPage,
  ) => loadMore(ids, key, fetchPage, false);

  const loadNewer = (
    ids: Map<number, number[]>,
    key: number,
    fetchPage: FetchPage,
  ) => loadMore(ids, key, fetchPage, true);

  // A list reopened shows only its newest page again, not every page
  // loaded before; the rest load back as the reader scrolls up. One short
  // of the newest stays until the newest replace it
  function trimToLatest(ids: Map<number, number[]>, key: number) {
    const loaded = ids.get(key);
    if (!loaded || hasNewer(key) || loaded.length <= PAGE_SIZE) return;
    ids.set(key, loaded.slice(-PAGE_SIZE));
    older.withMore.add(key);
  }

  function clear() {
    [older, newer].forEach((end) => {
      end.withMore.clear();
      end.loading.clear();
      end.failed.clear();
    });
  }

  return {
    paging,
    hasNewer,
    fetchLatest,
    loadOlder,
    loadNewer,
    trimToLatest,
    clear,
  };
};
