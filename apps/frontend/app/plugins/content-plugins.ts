import ContentRepository from '@/lib/content-plugins';

export default defineNuxtPlugin((nuxtApp) => {
  const extensions = new ContentRepository(nuxtApp.vueApp);
  nuxtApp.provide('ccRegistry', extensions.contentContainerRegistry);
  nuxtApp.provide('ceRegistry', extensions.contentElementRegistry);
  nuxtApp.provide('pluginRegistry', extensions.pluginRegistry);
});
