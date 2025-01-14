import camelCase from 'lodash/camelCase';
import { computed } from 'vue';
import { SCHEMAS } from '@tailor-cms/config';

interface ConfigCookie {
  statsigKey?: string;
  aiUiEnabled?: boolean;
  availableSchemas?: string;
  oidcEnabled?: boolean;
  oidcLoginText?: string;
  oidcLogoutEnabled?: boolean;
  [key: string]: any;
}

const parseSchemas = (schemas = '') =>
  schemas
    .split(',')
    .filter(Boolean)
    .map((schema) => schema.trim());

export const useConfigStore = defineStore('config', () => {
  const rawConfig = ref({});
  const config = reactive<ConfigCookie>({});

  const availableSchemas = computed(() => {
    const availableSchemas = parseSchemas(config.availableSchemas);
    if (!availableSchemas.length) return SCHEMAS;
    return SCHEMAS.filter((it) => availableSchemas.includes(it.id));
  });

  const oidcLoginText = computed(
    () => config.oidcLoginText ?? 'Sign in with SSO',
  );

  function getConfig() {
    const cookie = useCookie<ConfigCookie | undefined>('config');
    rawConfig.value = cookie.value ?? {};
    if (!cookie.value) return;
    Object.entries(cookie.value).forEach(([key, value]) => {
      const parsedKey = camelCase(key.replace('NUXT_PUBLIC_', ''));
      config[parsedKey] = value;
    });
    if (!import.meta.dev) cookie.value = undefined;
  }

  function personalize(statsigConfig: any) {
    Object.entries(statsigConfig.value).forEach(([key, value]) => {
      const parsedKey = camelCase(key);
      config[parsedKey] = value;
    });
  }

  return {
    getConfig,
    personalize,
    props: readonly(config),
    rawProps: readonly(rawConfig),
    availableSchemas,
    oidcLoginText,
  };
});
