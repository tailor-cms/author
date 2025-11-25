import { useConfigStore } from '@/stores/config';

export default defineNuxtPlugin(() => {
  const configStore = useConfigStore();
  configStore.getConfig();
});
