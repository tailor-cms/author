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
  const cookieConfig = reactive<ConfigCookie>({});

  const availableSchemas = computed(() => {
    const availableSchemas = (cookieConfig.availableSchemas || '')
      .split(',')
      .filter(Boolean)
      .map((schema) => schema.trim());
    if (!availableSchemas.length) return SCHEMAS;
    return SCHEMAS.filter((it) => availableSchemas.includes(it.id));
  });

  const aiUiEnabled = computed(() => cookieConfig.aiUiEnabled);
  const oidcEnabled = computed(() => cookieConfig.oidcEnabled);
  const oidcLoginText = computed(() => cookieConfig.oidcLoginText);
  const oidcLogoutEnabled = computed(() => cookieConfig.oidcLogoutEnabled);

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
