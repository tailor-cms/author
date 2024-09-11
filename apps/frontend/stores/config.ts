import { computed } from 'vue';
import { SCHEMAS } from 'tailor-config-shared';

export const useConfigStore = defineStore('config', () => {
  const runtimeConfig = useRuntimeConfig().public;

  const config = ref<any>({});

  const availableSchemas = computed(() => {
    const runtimeSchemas = (runtimeConfig.availableSchemas || '')
      .split(',')
      .filter(Boolean)
      .map((schema) => schema.trim());

    const availableSchemas = runtimeSchemas.length
      ? runtimeSchemas
      : config.value.availableSchemas || [];

    if (!availableSchemas.length) return SCHEMAS;
    return SCHEMAS.filter((it) => availableSchemas.includes(it.id));
  });

  const aiUiEnabled = computed(
    () => runtimeConfig.aiUiEnabled ?? config.value.aiUiEnabled ?? false,
  );

  function getConfig() {
    const cookie = useCookie('config');

    config.value = cookie.value;
    cookie.value = null;
  }

  return {
    getConfig,
    aiUiEnabled,
    availableSchemas,
  };
});
