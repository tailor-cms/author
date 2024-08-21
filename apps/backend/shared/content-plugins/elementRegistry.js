import config from '../../config/server/index.js';
import { elements } from '@tailor-cms/content-element-collection/server.js';
import hooksTypes from './elementHooks.js';
import pick from 'lodash/pick.js';
import storage from '../../repository/storage.js';

class ElementsRegistry {
  constructor() {
    this._registry = elements;
    this._hooks = {};
  }

  async initialize() {
    this.registerHooks();
  }

  registerHooks() {
    this._registry.forEach((it) => {
      Object.assign(this._hooks, {
        [it.type]: pick(it, Object.values(hooksTypes)),
      });
    });
  }

  getHook(elementType, hookName) {
    const elementHooks = this._hooks[elementType];
    if (!elementHooks || !elementHooks[hookName]) return;
    const services = { config: config.tce, storage };
    return (element, options) =>
      elementHooks[hookName](element, services, options);
  }
}

export default new ElementsRegistry();
