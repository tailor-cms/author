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
    cookie.value = undefined;
  }

  return {
    getConfig,
    props: readonly(config),
    rawProps: readonly(rawConfig),
    availableSchemas,
    oidcLoginText,
  };
});
