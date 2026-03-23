import { AssetType } from '@tailor-cms/interfaces/asset';

const categories = [
  { label: 'All', value: 'all' },
  { label: 'Documents', value: AssetType.Document },
  { label: 'Images', value: AssetType.Image },
  { label: 'Links', value: AssetType.Link },
  { label: 'Video', value: AssetType.Video },
  { label: 'Audio', value: AssetType.Audio },
  { label: 'Other', value: AssetType.Other },
];

export function useAssetFiltering() {
  const selectedCategory = ref('all');
  return { categories, selectedCategory };
}
