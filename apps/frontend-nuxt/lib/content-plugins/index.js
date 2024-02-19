import MetaRegistry from './MetaRegistry';

export default class ContentRepository {
  constructor(app) {
    this.metaRegistry = MetaRegistry(app);
  }
}
