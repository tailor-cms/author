import { CUSTOM_EMOJI } from '@tailor-cms/core-components';
import { schema } from '@tailor-cms/config';

import { asset as assetApi, exposedApi } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useEmojiStore } from '@/stores/emoji';

export default defineNuxtPlugin({
  hooks: {
    'app:created': () => {
      const authStore = useAuthStore();
      const nuxtApp = useNuxtApp();
      nuxtApp.provide('getCurrentUser', () => authStore.user);
      nuxtApp.provide('schemaService', schema);
      nuxtApp.provide('storageService', assetApi);
      nuxtApp.provide('api', exposedApi);
      // Vue provide, since `nuxtApp.provide` is not reachable by `inject`
      nuxtApp.vueApp.provide(CUSTOM_EMOJI, useEmojiStore());
    },
  },
});
