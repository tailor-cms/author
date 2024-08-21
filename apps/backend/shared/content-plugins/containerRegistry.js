import { elements } from '../../../../extensions/content-containers/server.js';
import { schema } from 'tailor-config-shared';

const { getContainerTemplateId: getId } = schema;

class ContainerRegistry {
  constructor() {
    this._registry = elements;
    this._staticsResolver = {};
    this._summaryBuilder = {};
    this._publishStructureBuilder = {};
  }

  async initialize() {
    this.buildLookups();
  }

  buildLookups() {
    this._registry.forEach((it) => {
      const id = getId(it);
      Object.assign(this._publishStructureBuilder, { [id]: it.fetch });
      Object.assign(this._staticsResolver, { [id]: it.resolve });
      Object.assign(this._summaryBuilder, { [id]: it.buildSummary });
    });
  }

  getPublishStructureBuilder(container) {
    return this._publishStructureBuilder[getId(container)];
  }

  getStaticsResolver(container) {
    return this._staticsResolver[getId(container)];
  }

  getSummaryBuilder(container) {
    return this._summaryBuilder[getId(container)];
  }
}

export default new ContainerRegistry();
