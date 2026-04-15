import { AssetType } from '@tailor-cms/interfaces/asset';

export const CATEGORY_ALL = 'ALL';

const categories = [
  { label: 'All', value: CATEGORY_ALL },
  { label: 'Documents', value: AssetType.Document },
  { label: 'Images', value: AssetType.Image },
  { label: 'Links', value: AssetType.Link },
  { label: 'Video', value: AssetType.Video },
  { label: 'Audio', value: AssetType.Audio },
  { label: 'Other', value: AssetType.Other },
];

export function useAssetFiltering() {
  const selectedCategory = ref(CATEGORY_ALL);
  return { categories, selectedCategory };
}
