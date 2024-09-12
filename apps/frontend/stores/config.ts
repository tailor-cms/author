import camelCase from 'lodash/camelCase';
import { computed } from 'vue';
import { SCHEMAS } from 'tailor-config-shared';

interface ConfigCookie {
  aiUiEnabled?: boolean;
  availableSchemas?: string;
  oidcEnabled?: boolean;
  oidcLoginText?: string;
  oidcLogoutEnabled?: boolean;
  [key: string]: any;
}

export const useConfigStore = defineStore('config', () => {
  const runtimeConfig = useRuntimeConfig().public;

  const cookieConfig = reactive<ConfigCookie>({});
  const config = import.meta.dev ? runtimeConfig : cookieConfig;

  const availableSchemas = computed(() => {
    const availableSchemas = (config.availableSchemas || '')
      .split(',')
      .filter(Boolean)
      .map((schema) => schema.trim());
    if (!availableSchemas.length) return SCHEMAS;
    return SCHEMAS.filter((it) => availableSchemas.includes(it.id));
  });

  const aiUiEnabled = computed(() => config.aiUiEnabled);
  const oidcEnabled = computed(() => config.oidcEnabled);
  const oidcLoginText = computed(() => config.oidcLoginText);
  const oidcLogoutEnabled = computed(() => config.oidcLogoutEnabled);

  function getConfig() {
    const cookie = useCookie<ConfigCookie | undefined>('config');
    if (!cookie.value) return;
    Object.entries(cookie.value).forEach(([key, value]) => {
      const parsedKey = camelCase(key.replace('NUXT_PUBLIC_', ''));
      cookieConfig[parsedKey] = value;
    });
    cookie.value = undefined;
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
