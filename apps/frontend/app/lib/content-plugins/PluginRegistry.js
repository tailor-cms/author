import { camelCase, cloneDeep, find, sortBy, upperFirst } from 'lodash-es';
import { elements } from '@tailor-cms/plugin-collection/client';
import { ref } from 'vue';

const toPascalCase = (str) => upperFirst(camelCase(str));
const getComponentName = (pluginId, slot) =>
  `Tp${toPascalCase(pluginId)}${slot}`;

/**
 * Plugin manifest example:
 * ```js
 * export default {
 *   type: 'MY_PLUGIN',
 *   version: '1.0',
 *   // Component slots
 *   AppendComponent,      // Below meta inputs
 *   GlobalComponent,      // Top nav
 *   PrependComponent,     // Before meta inputs
 *   ConfigComponent,      // Config panel
 *   // Store registration (accessible via useNuxtApp().$myStore)
 *   useStore: useMyStore,
 *   storeKey: 'myStore',
 *   // Hooks
 *   hooks: {
 *     'container:filter': (containers, ctx) => containers.filter(...),
 *     'container:transform': (data, ctx) => ({ ...data, ... }),
 *   },
 * };
 * ```
 *
 * Reactivity:
 * - dataVersion: Reactive counter that plugins can bump via invalidateData()
 *   to trigger component re-renders (e.g., when i18n language changes)
 *
 * Available hooks:
 * - repository:change   - Called when repository loads (receives { schema, repository })
 * - repository:unload   - Called when repository unloads
 * - container:filter    - Filter containers before display (pipeline)
 * - container:transform - Transform container data before create/save
 * - activity:filter     - Filter activities before display
 * - element:filter      - Filter elements before display
 * - data:value          - Get localized value from data object (receives value, { data, key })
 * - data:update         - Build updated data object for saving (receives data, { key, value })
 */
export default class PluginRegistry {
  constructor(app) {
    this.app = app;
    this._registry = [];
    this._stores = [];
    this._hooks = new Map();
    // Reactive version counter - plugins can bump to trigger re-renders
    this._dataVersion = ref(0);
    elements.forEach((element) => this.load(element));
  }

  // Get current data version (reactive)
  get dataVersion() {
    return this._dataVersion.value;
  }

  // Bump data version to trigger component re-renders
  invalidateData() {
    this._dataVersion.value++;
  }

  load(element) {
    const { app, _registry: registry, _stores: stores, _hooks: hooks } = this;
    const id = element.type;
    const position = registry.length;
    // Standard component slots
    const slots = ['Prepend', 'Append', 'Global', 'Config'];
    const entry = { id, position };
    slots.forEach((slot) => {
      const component = element[`${slot}Component`];
      if (component) {
        const name = getComponentName(id, slot);
        entry[`${slot.toLowerCase()}Component`] = component;
        entry[`${slot.toLowerCase()}ComponentName`] = name;
        app.component(name, component);
      }
    });
    // Collect store if plugin provides one
    if (element.useStore && element.storeKey) {
      stores.push({ key: element.storeKey, useStore: element.useStore });
    }
    // Register hooks
    if (element.hooks) {
      Object.entries(element.hooks).forEach(([hookName, handler]) => {
        if (!hooks.has(hookName)) hooks.set(hookName, []);
        hooks.get(hookName).push({ pluginId: id, handler });
      });
    }
    registry.push(entry);
  }

  // Register all plugin stores with nuxtApp
  registerStores(nuxtApp) {
    this._stores.forEach(({ key, useStore }) => {
      nuxtApp.provide(key, useStore());
    });
  }

  /**
   * Run a filter hook - data passes through all handlers (pipeline)
   */
  filter(hookName, data, context = {}) {
    const handlers = this._hooks.get(hookName) || [];
    return handlers.reduce((result, { handler }) => handler(result, context), data);
  }

  /**
   * Run a transform hook - modify data object
   */
  transform(hookName, data, context = {}) {
    const handlers = this._hooks.get(hookName) || [];
    return handlers.reduce((result, { handler }) => handler(result, context), data);
  }

  get all() {
    return sortBy(cloneDeep(this._registry), 'position');
  }

  get(id) {
    if (!id) return null;
    return find(this._registry, { id });
  }

  getPrependComponents() {
    return this._registry.filter((it) => it.prependComponent);
  }

  getAppendComponents() {
    return this._registry.filter((it) => it.appendComponent);
  }

  getGlobalComponents() {
    return this._registry.filter((it) => it.globalComponent);
  }

  getConfigComponents() {
    return this._registry.filter((it) => it.configComponent);
  }
}
