import type { Asset } from '@tailor-cms/interfaces/asset';

export function useAssetSelection(items: Ref<Asset[]>) {
  const selected = reactive(new Map<number, Asset>());

  const isAllSelected = computed(
    () => items.value.length > 0 && items.value.every((a) => selected.has(a.id)),
  );

  function toggle(asset: Asset) {
    if (selected.has(asset.id)) selected.delete(asset.id);
    else selected.set(asset.id, asset);
  }

  function selectAll() {
    items.value.forEach((a) => selected.set(a.id, a));
  }

  function deselectAll() {
    items.value.forEach((a) => selected.delete(a.id));
  }

  function clear() {
    selected.clear();
  }

  return { selected, isAllSelected, toggle, selectAll, deselectAll, clear };
}
