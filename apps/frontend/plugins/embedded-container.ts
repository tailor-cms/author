import { EmbeddedContainer } from '@tailor-cms/core-components';

export default defineNuxtPlugin((nuxt) => {
  nuxt.vueApp.component('TailorEmbeddedContainer', EmbeddedContainer);
});
