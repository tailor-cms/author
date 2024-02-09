import ContentRepository from "@/lib/content-plugins";

export default defineNuxtPlugin((nuxtApp) => {
  const pluginRegistry = new ContentRepository(nuxtApp.vueApp);
  nuxtApp.provide('pluginRegistry', pluginRegistry);
});
