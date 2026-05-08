import {
  ContentElement,
  EmbeddedContainer,
  FileInputLegacy,
} from '@tailor-cms/core-components';

export default defineNuxtPlugin((nuxt) => {
  nuxt.vueApp.component('TailorContentElement', ContentElement);
  nuxt.vueApp.component('TailorEmbeddedContainer', EmbeddedContainer);
  nuxt.vueApp.component('TailorAssetInput', FileInputLegacy);
});
