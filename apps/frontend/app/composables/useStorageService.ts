import { useCurrentRepository } from '@/stores/current-repository';

export const useStorageService = () => {
  const { $storageService: storage } = useNuxtApp();
  const repositoryStore = useCurrentRepository();
  return {
    getUrl: (key: string) => storage.getUrl(repositoryStore.repositoryId, key),
    upload: (form: FormData) => storage.upload(repositoryStore.repositoryId, form),
  };
};
