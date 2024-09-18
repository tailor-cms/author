import { schema } from 'tailor-config-shared';

import { asset as assetApi, exposedApi } from '@/api';
import { useAuthStore } from '@/stores/auth';

export default defineNuxtPlugin({
  hooks: {
    'app:created': () => {
      const authStore = useAuthStore();
      const nuxtApp = useNuxtApp();
      nuxtApp.provide('getCurrentUser', () => authStore.user);
      nuxtApp.provide('schemaService', schema);
      nuxtApp.provide('storageService', assetApi);
      nuxtApp.provide('api', exposedApi);
    },
  },
});
