import {
  ContentElement,
  ElementPlaceholder,
  EmbeddedContainer,
  FileInput,
  FileInputLegacy,
  TailorDialog,
} from '@tailor-cms/core-components';

export default defineNuxtPlugin((nuxt) => {
  nuxt.vueApp.component('TailorDialog', TailorDialog);
  nuxt.vueApp.component('TailorContentElement', ContentElement);
  nuxt.vueApp.component('TailorEmbeddedContainer', EmbeddedContainer);
  nuxt.vueApp.component('TailorAssetInput', FileInputLegacy);
  nuxt.vueApp.component('TailorFileInput', FileInput);
  nuxt.vueApp.component('TailorElementPlaceholder', ElementPlaceholder);
});
