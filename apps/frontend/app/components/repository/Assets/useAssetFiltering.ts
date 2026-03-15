import { getAssetCategory } from './utils';

const categories = [
  { label: 'All', value: 'all' },
  { label: 'Documents', value: 'document' },
  { label: 'Images', value: 'image' },
  { label: 'Links', value: 'link' },
  { label: 'Video', value: 'video' },
  { label: 'Audio', value: 'audio' },
  { label: 'Other', value: 'other' },
];

export function useAssetFiltering(assets: Ref<any[]>) {
  const selectedCategory = ref('all');

  const filteredAssets = computed(() => {
    if (selectedCategory.value === 'all') return assets.value;
    return assets.value.filter(
      (a) => getAssetCategory(a) === selectedCategory.value,
    );
  });

  return { categories, selectedCategory, filteredAssets };
}
