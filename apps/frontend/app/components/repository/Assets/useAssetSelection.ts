export function useAssetSelection(items: Ref<any[]>) {
  const selectedIds = reactive(new Set<number>());

  function toggle(asset: any) {
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
