import type { Asset } from '@tailor-cms/interfaces/asset';
import type { DiscussionServices } from '@tailor-cms/core-components';

import { repositoryAsset } from '@/api';
import { useAssetStore } from '@/stores/assets';

/**
 * API for discussion services.
 */
export const useDiscussionServices = (
  repositoryId: MaybeRefOrGetter<number>,
): DiscussionServices => {
  const notify = useNotification();
  const assetStore = useAssetStore();

  const { suggestUsers, suggestReferences } =
    useMessageSuggestions(repositoryId);

  const uploadFiles = async (files: File[]) => {
    try {
      const assets: Asset[] = await repositoryAsset.upload(
        toValue(repositoryId),
        files,
      );
      assets.forEach((it) => assetStore.add(it));
      return assets.map((it) => ({ id: it.id, label: it.name }));
    } catch {
      notify('Upload failed. Please try again.', { color: 'error' });
      return [];
    }
  };

  return { suggestUsers, suggestReferences, uploadFiles };
};
