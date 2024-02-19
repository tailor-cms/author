import Clipboard from 'v-clipboard';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Clipboard);
});
