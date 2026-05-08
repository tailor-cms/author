import repositoryAssetApi from '@/api/repositoryAsset';
import { useCurrentRepository } from '@/stores/current-repository';

const toFormData = (file: File) => {
  const form = new FormData();
  form.append('file', file, file.name);
  return form;
};

export const useStorageService = () => {
  const { $storageService: storage } = useNuxtApp() as any;
  const repositoryStore = useCurrentRepository();

  const upload = (val: File | FormData) => {
    // Accept both File and FormData for backward compatibility
    // (compiled CE packages pass FormData, future code can pass File directly)
    const form = val instanceof FormData ? val : toFormData(val);
    return storage.upload(repositoryStore.repositoryId, form);
  };

  return {
    upload,
    getUrl: (key: string) => storage.getUrl(repositoryStore.repositoryId, key),
    list: (params = {}) =>
      repositoryAssetApi.list(repositoryStore.repositoryId, {
        signed: true,
        ...params,
      }),
  };
};
