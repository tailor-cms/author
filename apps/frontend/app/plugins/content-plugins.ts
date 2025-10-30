import ContentRepository from '@/lib/content-plugins';

export default defineNuxtPlugin((nuxtApp) => {
  const pluginRegistry = new ContentRepository(nuxtApp.vueApp);
  const provide = {
    pluginRegistry,
    ccRegistry: pluginRegistry.contentContainerRegistry,
    ceRegistry: pluginRegistry.contentElementRegistry
  };
  return { provide };
});
