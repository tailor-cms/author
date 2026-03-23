import { AssetType } from '@tailor-cms/interfaces/asset';

const VIDEO_PROVIDERS = /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com/i;

const categories = [
  { label: 'All', value: 'all' },
  { label: 'Documents', value: AssetType.Document },
  { label: 'Images', value: AssetType.Image },
  { label: 'Links', value: AssetType.Link },
  { label: 'Video', value: AssetType.Video },
  { label: 'Audio', value: AssetType.Audio },
  { label: 'Other', value: AssetType.Other },
];

function isVideoLink(asset: any): boolean {
  if (asset.type !== AssetType.Link) return false;
  const url = asset.meta?.url || '';
  const provider = asset.meta?.provider || '';
  const ct = asset.meta?.contentType || asset.meta?.linkContentType || '';
  return (
    ct === AssetType.Video ||
    provider === 'youtube' ||
    provider === 'vimeo' ||
    provider === 'dailymotion' ||
    VIDEO_PROVIDERS.test(url)
  );
}

// "video" includes native video files AND video-provider links.
// "link" excludes video-provider links (they appear under "video").
export function matchesCategory(asset: any, category: string): boolean {
  if (category === 'all') return true;
  if (category === AssetType.Video) {
    return asset.type === AssetType.Video || isVideoLink(asset);
  }
  if (category === AssetType.Link) {
    return asset.type === AssetType.Link && !isVideoLink(asset);
  }
  return asset.type === category;
}

export function useAssetFiltering() {
  const selectedCategory = ref('all');
  return { categories, selectedCategory };
}
