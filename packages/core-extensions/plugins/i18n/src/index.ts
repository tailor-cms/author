import type { Repository } from '@tailor-cms/interfaces/repository';

import { useNuxtApp } from '#app';
import AppendComponent from './AppendComponent.vue';
import GlobalComponent from './GlobalLanguageSelector.vue';
import { useI18nStore } from './store';
import type { Schema } from '@tailor-cms/interfaces/schema';
import type { Activity } from '@tailor-cms/interfaces/activity';

type Data = Record<string, any>;

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
    'repository:change': (
      _data: Data,
      context: { schema: Schema; repository: Repository },
    ) => {
      const i18n = useI18nStore();
      i18n.initialize(context.schema?.i18n);
    },
    // Reset i18n state when repository unloads
    'repository:unload': () => {
      const i18n = useI18nStore();
      i18n.$reset();
    },
    // Filter containers by current language
    'container:filter': (containers: Activity[]) => {
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
    'container:transform': (data: Data) => {
      const i18n = useI18nStore();
      if (!i18n.isEnabled) return data;
      return {
        ...data,
        data: { ...(data.data || {}), _i18n: i18n.currentLanguage },
      };
    },
    // Get localized value from data object
    'data:value': (
      value: any,
      ctx: { data: Data; key: string; lang?: string; type?: string },
    ) => {
      const i18n = useI18nStore();
      if (!i18n.isEnabled) return value;
      if (ctx.type) {
        const { $metaRegistry } = useNuxtApp() as any;
        if (!$metaRegistry.get(ctx.type)?.i18n) return value;
      }
      return i18n.getLocalizedValue(ctx.data, ctx.key, ctx.lang);
    },
    // Build updated data object for saving with localization
    'data:update': (
      data: Data,
      ctx: { value: any; key: string; lang?: string; type?: string },
    ) => {
      const i18n = useI18nStore();
      if (!i18n.isEnabled) return { ...data, [ctx.key]: ctx.value };
      if (ctx.type) {
        const { $metaRegistry } = useNuxtApp() as any;
        if ($metaRegistry.get(ctx.type)?.i18n) return;
        return { ...data, [ctx.key]: ctx.value };
      }
      return i18n.setLocalizedValue(data, ctx.key, ctx.value, ctx.lang);
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
