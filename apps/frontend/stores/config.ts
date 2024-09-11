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

    const availableSchemas = import.meta.dev
      ? runtimeSchemas
      : config.value.NUXT_PUBLIC_AVAILABLE_SCHEMAS || [];

    if (!availableSchemas.length) return SCHEMAS;
    return SCHEMAS.filter((it) => availableSchemas.includes(it.id));
  });

  const aiUiEnabled = computed(() =>
    import.meta.dev
      ? runtimeConfig.aiUiEnabled
      : config.value.NUXT_PUBLIC_AI_UI_ENABLED,
  );

  const oidcEnabled = computed(() =>
    import.meta.dev
      ? runtimeConfig.oidcEnabled
      : config.value.NUXT_PUBLIC_OIDC_ENABLED,
  );

  const oidcLoginText = computed(() =>
    import.meta.dev
      ? runtimeConfig.oidcLoginText
      : config.value.NUXT_PUBLIC_OIDC_LOGIN_TEXT,
  );

  const oidcLogoutEnabled = computed(() =>
    import.meta.dev
      ? runtimeConfig.oidcLogoutEnabled
      : config.value.NUXT_PUBLIC_OIDC_LOGOUT_ENABLED,
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
    oidcEnabled,
    oidcLoginText,
    oidcLogoutEnabled,
  };
});
