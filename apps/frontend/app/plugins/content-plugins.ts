import ContentRepository from '@/lib/content-plugins';

export default defineNuxtPlugin((nuxtApp) => {
  const extensions = new ContentRepository(nuxtApp.vueApp);
  nuxtApp.provide('ccRegistry', extensions.contentContainerRegistry);
  nuxtApp.provide('ceRegistry', extensions.contentElementRegistry);
  nuxtApp.provide('metaRegistry', extensions.metaRegistry);
  nuxtApp.provide('pluginRegistry', extensions.pluginRegistry);
  // Register plugin stores (e.g., i18n store from i18n plugin)
  extensions.pluginRegistry.registerStores(nuxtApp);
});
