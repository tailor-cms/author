import type { Asset } from '@tailor-cms/interfaces/asset';

import { repositoryAsset as api } from '@/api';
import { useCurrentRepository } from './current-repository';

type Id = number | string;

/**
 * Every asset the app has loaded, by id. A file shows up in many places
 * at once (the library, message previews, shared files, reference
 * chips), so each is fetched once and read from here.
 */
export const useAssetStore = defineStore('assets', () => {
  const repoStore = useCurrentRepository();

  const $items = reactive(new Map<number, Asset>());
  const pending = new Map<number, Promise<Asset | null>>();

  const findById = (id: Id): Asset | null => $items.get(Number(id)) ?? null;

  function add(asset: Asset): Asset {
    $items.set(asset.id, asset);
    return $items.get(asset.id) as Asset;
  }

  function update(changes: Partial<Asset> & { id: number }) {
    const asset = $items.get(changes.id);
    if (asset) $items.set(changes.id, { ...asset, ...changes });
  }

  function remove(id: Id) {
    $items.delete(Number(id));
  }

  function fetch(repositoryId: number, id: Id): Promise<Asset | null> {
    const assetId = Number(id);
    const asset = $items.get(assetId);
    if (asset) return Promise.resolve(asset);
    const inFlight = pending.get(assetId);
    if (inFlight) return inFlight;
    const request: Promise<Asset | null> = api
      .get(repositoryId, assetId)
      .then((it: Asset) => add(it))
      .catch(() => null)
      .finally(() => pending.delete(assetId));
    pending.set(assetId, request);
    return request;
  }

  function $reset() {
    $items.clear();
    pending.clear();
  }

  // Assets belong to a repository; leaving it drops them
  watch(() => repoStore.repositoryId, () => $reset());

  return { findById, fetch, add, update, remove, $reset };
});
