import type { schema as registrySchemaApi } from '@tailor-cms/config';

import { asset as assetApi, exposedApi } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useSchemaStore } from '@/stores/schema';

type SchemaService = typeof registrySchemaApi;
export default defineNuxtPlugin({
  hooks: {
    'app:created': () => {
      const authStore = useAuthStore();
      const schemaStore = useSchemaStore();
      const nuxtApp = useNuxtApp();
      nuxtApp.provide('getCurrentUser', () => authStore.user);
      // Re-read `schemaStore.api` on every access - it's a computed
      // that rebuilds when new snapshots register, so a cached
      // reference would freeze the surface.
      const schemaService = new Proxy({} as SchemaService, {
        get: (_, prop: string) =>
          (schemaStore.api as unknown as Record<string, unknown>)[prop],
      });
      nuxtApp.provide('schemaService', schemaService);
      nuxtApp.provide('storageService', assetApi);
      nuxtApp.provide('api', exposedApi);
    },
  },
});
