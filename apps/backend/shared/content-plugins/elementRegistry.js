import { elements } from '@tailor-cms/content-element-collection/server.js';
import pick from 'lodash/pick.js';
import storage from '../../repository/storage.js';
import hooksTypes from './elementHooks.js';
import config from '#config';

class ElementsRegistry {
  constructor() {
    this._registry = elements;
    this._hooks = {};
    this._procedures = {};
    this._aiSchemas = {};
  }

  async initialize() {
    this.registerHooks();
  }

  registerHooks() {
    this._registry.forEach((it) => {
      Object.assign(this._hooks, {
        [it.type]: pick(it, Object.values(hooksTypes)),
      });
      Object.assign(this._aiSchemas, {
        [it.type]: it.ai,
      });
      if (it.procedures) this._procedures[it.type] = it.procedures;
    });
  }

  getAiConfig(elementType) {
    return this._aiSchemas[elementType];
  }

  getHook(elementType, hookName) {
    const elementHooks = this._hooks[elementType];
    if (!elementHooks || !elementHooks[hookName]) return;
    const services = { config: pick(config, ['tce']), storage };
    return (element, options) => {
      const context = options?.context || {};
      return elementHooks[hookName](
        element,
        { ...services, context },
        'authoring',
      );
    };
  }

  getProcedure(elementType, procedure) {
    const handlers = this._procedures[elementType];
    if (!handlers || !handlers[procedure]) return;
    const services = { config: pick(config, ['tce']), storage };
    return (element, payload, options) => {
      const context = options?.context || {};
      return handlers[procedure](element, { ...services, context }, payload);
    };
  }
}

export default new ElementsRegistry();
