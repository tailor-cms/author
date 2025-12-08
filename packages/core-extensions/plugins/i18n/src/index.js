import AppendComponent from './AppendComponent.vue';
import GlobalComponent from './GlobalLanguageSelector.vue';
import { useI18nStore } from './store.ts';

export default {
  type: 'I18N',
  version: '1.0',
  // Standard component slots
  AppendComponent, // Below meta inputs (translation status badge)
  GlobalComponent, // Top nav (language selector dropdown)
  PrependComponent: null,
  ConfigComponent: null,
  // Store factory and injection key
  useStore: useI18nStore,
  storeKey: 'i18n',
  // Hooks for data filtering/transformation
  hooks: {
    // Initialize i18n from schema config when repository loads
    'repository:change': (_data, { schema }) => {
      const i18n = useI18nStore();
      i18n.initialize(schema?.i18n);
    },
    // Reset i18n state when repository unloads
    'repository:unload': () => {
      const i18n = useI18nStore();
      i18n.$reset();
    },
    // Filter containers by current language
    'container:filter': (containers) => {
      const i18n = useI18nStore();
      if (!i18n.isEnabled) return containers;
      const currentLang = i18n.currentLanguage;
      const defaultLang = i18n.defaultLanguage;
      return containers.filter((container) => {
        const containerLang = container.data?._i18n;
        // Containers without _i18n tag belong to default language
        if (!containerLang) return currentLang === defaultLang;
        return containerLang === currentLang;
      });
    },
    // Tag new containers with current language
    'container:transform': (data) => {
      const i18n = useI18nStore();
      if (!i18n.isEnabled) return data;
      return {
        ...data,
        data: { ...(data.data || {}), _i18n: i18n.currentLanguage },
      };
    },
    // Get localized value from data object
    'data:value': (value, { data, key, lang, type }) => {
      const i18n = useI18nStore();
      if (!i18n.isEnabled) return value;
      if (type) {
        const { $metaRegistry } = useNuxtApp();
        if (!$metaRegistry.get(type)?.i18n) return value;
      }
      return i18n.getLocalizedValue(data, key, lang);
    },
    // Build updated data object for saving with localization
    'data:update': (data, { key, value, lang, type }) => {
      const i18n = useI18nStore();
      if (!i18n.isEnabled) return { ...data, [key]: value };
      if (type) {
        const { $metaRegistry } = useNuxtApp();
        if (!$metaRegistry.get(type)?.i18n) return { ...data, [key]: value };
      }
      return i18n.setLocalizedValue(data, key, value, lang);
    },
  },
  // TODO:
  // Processor
  // Override default presentation (e.g. read only view) / main component
  // Permission + plugin (e.g. View only if collaborator)
  // Dedicated page for the plugin
  // Server code & routes
  // Interfaces for interoperability
};

// Named exports
export { AppendComponent, GlobalComponent, useI18nStore };
