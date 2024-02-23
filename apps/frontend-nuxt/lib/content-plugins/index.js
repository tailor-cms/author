import ContentContainerRegistry from './ContentContainerRegistry';
import ContentElementRegistry from './ContentElementRegistry';
import MetaRegistry from './MetaRegistry';

export default class ContentRepository {
  constructor(app) {
    this.contentElementRegistry = ContentElementRegistry(app);
    this.contentContainerRegistry = ContentContainerRegistry(app);
    this.metaRegistry = MetaRegistry(app);
  }
}
