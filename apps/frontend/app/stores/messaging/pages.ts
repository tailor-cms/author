import type { Message } from '@tailor-cms/interfaces/comment';
import type { MessageCache } from './messageCache';

import { map } from 'lodash-es';

// Messages per request; a full page means older ones may remain
export const PAGE_SIZE = 50;

type FetchPage = (before?: number) => Promise<unknown>;

// Loading a list's earlier messages, in VInfiniteScroll's terms: more to
// load, loading, failed, or the start reached
export const PagingStatus = {
  Ok: 'ok',
  Loading: 'loading',
  Error: 'error',
  Empty: 'empty',
} as const;

export type PagingStatus = (typeof PagingStatus)[keyof typeof PagingStatus];

/**
 * Message lists read a page at a time, working back from the newest; one
 * per thread or reply chain, keyed by its id.
 */
export const createMessagePages = (messageCache: MessageCache) => {
  // Lists with older messages still on the server
  const withOlder = reactive(new Set<number>());
  const loadingOlder = reactive(new Set<number>());
  // Lists whose last request for older messages failed
  const failedOlder = reactive(new Set<number>());

  const hasOlder = (key?: number | null) => !!key && withOlder.has(key);

  const isLoadingOlder = (key?: number | null) =>
    !!key && loadingOlder.has(key);

  const hasLoadError = (key?: number | null) => !!key && failedOlder.has(key);

  const status = (key?: number | null): PagingStatus => {
    if (!hasOlder(key)) return PagingStatus.Empty;
    if (isLoadingOlder(key)) return PagingStatus.Loading;
    return hasLoadError(key) ? PagingStatus.Error : PagingStatus.Ok;
  };

  function track(key: number, page: unknown) {
    const isFull = (page as Message[]).length >= PAGE_SIZE;
    if (isFull) withOlder.add(key);
    else withOlder.delete(key);
    return page as Message[];
  }

  const fetchLatest = async (key: number, fetchPage: FetchPage) =>
    track(key, await fetchPage());

  // Puts the page before the first loaded message ahead of `ids`; a
  // failure is kept, for the list to offer a retry
  async function loadOlder(
    ids: Map<number, number[]>,
    key: number,
    fetchPage: FetchPage,
  ) {
    const before = ids.get(key)?.[0];
    if (!before || !hasOlder(key) || isLoadingOlder(key)) return;
    loadingOlder.add(key);
    failedOlder.delete(key);
    try {
      const page = await fetchPage(before);
      // Reloaded from the newest meanwhile
      if (ids.get(key)?.[0] !== before) return;
      const older = track(key, page).map((it) => messageCache.setLocal(it));
      ids.set(key, [...map(older, 'id'), ...ids.get(key)!]);
    } catch {
      failedOlder.add(key);
    } finally {
      loadingOlder.delete(key);
    }
  }

  // A list reopened shows only its newest page again, not every page
  // loaded before; the rest load back as the reader scrolls up
  function trimToLatest(ids: Map<number, number[]>, key: number) {
    const loaded = ids.get(key);
    if (!loaded || loaded.length <= PAGE_SIZE) return;
    ids.set(key, loaded.slice(-PAGE_SIZE));
    withOlder.add(key);
  }

  function clear() {
    withOlder.clear();
    loadingOlder.clear();
    failedOlder.clear();
  }

  return {
    status,
    fetchLatest,
    loadOlder,
    trimToLatest,
    clear,
  };
};
