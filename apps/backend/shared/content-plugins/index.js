import Promise from 'bluebird';
import containerRegistry from './containerRegistry.js';
import elementRegistry from './elementRegistry.js';

class ContentPluginRegistry {
  constructor() {
    this.containerRegistry = containerRegistry;
    this.elementRegistry = elementRegistry;
  }

  initialize() {
    const registries = Object.values(this);
    return Promise.map(registries, (it) => it.initialize());
  }
}

export default new ContentPluginRegistry();
