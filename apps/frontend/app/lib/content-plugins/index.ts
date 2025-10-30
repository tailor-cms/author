import type { App } from 'vue';
import CERegistry from './ContentElementRegistry';
import CCRegistry from './ContentContainerRegistry';
import type { ContentElementRegistry } from './ContentElementRegistry';
import MIRegistry from './MetaRegistry';
import type ComponentRegistry from './ComponentRegistry';

export default class ContentRepository {
  contentElementRegistry: ContentElementRegistry;
  contentContainerRegistry: ComponentRegistry;
  metaRegistry: ComponentRegistry;

  constructor(app: App<Element>) {
    this.contentElementRegistry = CERegistry(app);
    this.contentContainerRegistry = CCRegistry(app);
    this.metaRegistry = MIRegistry(app);
  }
}
