import type { Asset } from '@tailor-cms/interfaces/asset';

export function useAssetSelection(items: Ref<Asset[]>) {
  const selectedIds = reactive(new Set<number>());

  function toggle(asset: Asset) {
    if (selectedIds.has(asset.id)) selectedIds.delete(asset.id);
    else selectedIds.add(asset.id);
  }

  function selectAll() {
    items.value.forEach((a) => selectedIds.add(a.id));
  }

  function clear() {
    selectedIds.clear();
  }

  return { selectedIds, toggle, selectAll, clear };
}
