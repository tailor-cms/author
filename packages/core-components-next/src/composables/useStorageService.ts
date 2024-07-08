import { inject } from 'vue';

export const useStorageService = () => {
  const storage = inject<any>('$storageService');
  const currentRepository = inject<any>('$repository');

  return {
    getUrl: (key: string) => storage.getUrl(currentRepository.value?.id, key),
    upload: (file: any) => storage.upload(currentRepository.value?.id, file),
  };
};
