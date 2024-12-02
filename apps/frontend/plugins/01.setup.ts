import { useConfigStore } from '@/stores/config';

export default function () {
  const configStore = useConfigStore();
  configStore.getConfig();
}
