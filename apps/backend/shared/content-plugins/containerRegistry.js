import { elements } from '@tailor-cms/content-container-collection/server.js';
import { schema } from '@tailor-cms/config';

const { getContainerTemplateId: getId } = schema;

class ContainerRegistry {
  constructor() {
    this._registry = elements;
    this._staticsResolver = {};
    this._summaryBuilder = {};
    this._publishStructureBuilder = {};
    this._schemaDescribers = {};
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
      if (it.describeSchema) {
        Object.assign(this._schemaDescribers, { [id]: it.describeSchema });
      }
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

  /**
   * Describe the container's full structure. For nested
   * templates with a registered describeSchema, delegates
   * to the template. For flat templates (no describer),
   * returns the container's direct contentElementConfig.
   * This is the single source of truth for container
   * structure - both nested and flat.
   */
  describeSchema(container) {
    const describer = this._schemaDescribers[getId(container)];
    if (describer) return describer(container.config);
    // Flat container - no subcontainers, direct element config
    return {
      subcontainers: [],
      elementConfig: container.contentElementConfig || null,
    };
  }

  /**
   * Resolve subcontainer types for a container.
   * Derived from describeSchema - returns the type
   * strings only. Returns [] for flat templates.
   */
  getSubTypes(container) {
    const { subcontainers } = this.describeSchema(container);
    return (subcontainers || []).map((s) => s.type);
  }
}

export default new ContainerRegistry();
