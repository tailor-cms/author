const categories = [
  { label: 'All', value: 'all' },
  { label: 'Documents', value: 'document' },
  { label: 'Images', value: 'image' },
  { label: 'Links', value: 'link' },
  { label: 'Video', value: 'video' },
  { label: 'Audio', value: 'audio' },
  { label: 'Other', value: 'other' },
];

export function useAssetFiltering() {
  const selectedCategory = ref('all');
  return { categories, selectedCategory };
}
