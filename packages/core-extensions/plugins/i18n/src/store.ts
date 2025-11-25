import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

export interface I18nLanguage {
  code: string;
  name: string;
}

export interface I18nConfig {
  enabled: boolean;
  languages: I18nLanguage[];
  defaultLanguage: string;
}

export const useI18nStore = defineStore('i18n', () => {
  // State
  const currentLanguage = ref<string>('en');
  const config = ref<I18nConfig | null>(null);

  // Getters
  const isEnabled = computed(() => config.value?.enabled ?? false);
  const availableLanguages = computed(() => config.value?.languages ?? []);
  const defaultLanguage = computed(() => config.value?.defaultLanguage ?? 'en');
  const language = computed(() => currentLanguage.value);

  // Initialize from schema i18n config
  function initialize(i18nConfig: I18nConfig | undefined) {
    if (i18nConfig?.enabled) {
      config.value = i18nConfig;
      currentLanguage.value = i18nConfig.defaultLanguage || 'en';
    } else {
      config.value = null;
    }
  }

  // Change current editing language
  function setLanguage(langCode: string) {
    if (!isEnabled.value) return;
    const exists = availableLanguages.value.some((l) => l.code === langCode);
    if (!exists) return;
    currentLanguage.value = langCode;
    // Notify plugin registry to trigger component re-renders
    const { $pluginRegistry } = useNuxtApp() as any;
    $pluginRegistry?.invalidateData();
  }

  // Get value for current language with fallback to default
  function getLocalizedValue<T>(data: any, key: string): T | undefined {
    if (!data) return undefined;
    if (!isEnabled.value) return data[key];
    const currLang = currentLanguage.value;
    const defLang = defaultLanguage.value;
    // Default language reads from root level
    if (currLang === defLang) return data[key];
    // Non-default: try language-specific, fallback to root
    if (data[currLang]?.[key] !== undefined) return data[currLang][key];
    return data[key];
  }

  // Set value for current language
  function setLocalizedValue(data: any, key: string, value: any): any {
    if (!isEnabled.value) return { ...data, [key]: value };
    const currLang = currentLanguage.value;
    const defLang = defaultLanguage.value;
    // Default language saves to root level
    if (currLang === defLang) return { ...data, [key]: value };
    // Non-default saves to data[lang].key
    return {
      ...data,
      [currLang]: { ...(data[currLang] || {}), [key]: value },
    };
  }

  // Get translation completion status for a field
  function getTranslationStatus(
    data: any,
    key: string,
  ): Record<string, boolean> {
    if (!isEnabled.value || !data) return {};
    const defLang = defaultLanguage.value;
    return availableLanguages.value.reduce(
      (acc, lang) => {
        const val =
          lang.code === defLang ? data[key] : data[lang.code]?.[key];
        acc[lang.code] = val !== undefined && val !== null && val !== '';
        return acc;
      },
      {} as Record<string, boolean>,
    );
  }

  // Get info about which language value is being displayed
  function getDisplayedLanguage(
    data: any,
    key: string,
  ): { code: string; isFallback: boolean } | null {
    if (!data || !isEnabled.value) return null;
    const currLang = currentLanguage.value;
    const defLang = defaultLanguage.value;
    if (currLang === defLang) {
      return data[key] !== undefined
        ? { code: currLang, isFallback: false }
        : null;
    }
    if (data[currLang]?.[key] !== undefined) {
      return { code: currLang, isFallback: false };
    }
    if (data[key] !== undefined) {
      return { code: defLang, isFallback: true };
    }
    return null;
  }

  function $reset() {
    currentLanguage.value = 'en';
    config.value = null;
  }

  return {
    currentLanguage,
    config,
    language,
    isEnabled,
    availableLanguages,
    defaultLanguage,
    initialize,
    setLanguage,
    getLocalizedValue,
    setLocalizedValue,
    getTranslationStatus,
    getDisplayedLanguage,
    $reset,
  };
});
