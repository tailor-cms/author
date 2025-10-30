import { useCurrentRepository } from '@/stores/current-repository';

export const useStorageService = () => {
  const { $storageService: storage } = useNuxtApp() as any;
  const repositoryStore = useCurrentRepository();

  return {
    getUrl: (key: string) => storage.getUrl(repositoryStore.repositoryId, key),
    upload: (form: FormData) => storage.upload(repositoryStore.repositoryId, form),
  };
};
