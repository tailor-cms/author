import { asset as assetApi, exposedApi } from '@/api';
import { schema } from 'tailor-config-shared';
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
      // $teRegistry: contentPluginRegistry.elementRegistry,
      // $ccRegistry: contentPluginRegistry.containerRegistry,
    }
  }
});
