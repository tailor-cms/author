import { schema } from '@tailor-cms/config';

import { asset as assetApi, exposedApi } from '@/api';
import { useAuthStore } from '@/stores/auth';

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore();
  const provide = {
    getCurrentUser: () => authStore.user,
    schemaService: schema,
    storageService: assetApi,
    api: exposedApi,
  };
  return { provide };
});
