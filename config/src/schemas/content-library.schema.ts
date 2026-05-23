import type {
  ActivityConfig,
  ContentContainerConfig,
  Schema,
} from '@tailor-cms/interfaces/schema';
import { ContentContainerType } from '@tailor-cms/content-container-collection/types.js';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';

import { DEFAULT_WORKFLOW } from '../workflows/default.workflow';

enum ActivityType {
  Collection = 'COLLECTION',
  Item = 'ITEM',
  Section = 'SECTION',
}

const COLLECTION: ActivityConfig = {
  type: ActivityType.Collection,
  rootLevel: true,
  isTrackedInWorkflow: false,
  label: 'Collection',
  color: '#9C27B0',
  subLevels: [ActivityType.Item],
  ai: {
    definition: `
      Collections group reusable Library Items by theme or domain.
      A Collection is purely organizational - it has no body
      content; the Items inside hold the reusable material that
      other repositories link to.`,
  },
};

const ITEM: ActivityConfig = {
  type: ActivityType.Item,
  isTrackedInWorkflow: true,
  label: 'Library Item',
  color: '#7B1FA2',
  contentContainers: [ActivityType.Section],
  ai: {
    definition:
      'A reusable content item that can be linked to other repositories.',
  },
  // Cross-schema linking: ITEM becomes PAGE in COURSE_SCHEMA
  mapsTo: {
    COURSE_SCHEMA: { type: 'PAGE' },
  },
};

const SECTION: ContentContainerConfig = {
  type: ActivityType.Section,
  templateId: ContentContainerType.Default,
  label: 'Section',
  contentElementConfig: [
    ContentElementType.TiptapHtml,
    ContentElementType.Image,
    ContentElementType.Video,
    ContentElementType.Embed,
    ContentElementType.Pdf,
  ],
  ai: {
    definition: 'Content section of a library item.',
    outputRules: {
      prompt: `
        - Library shape: this content will be linked into multiple
          repositories with different surrounding contexts. Keep
          it modular and self-contained: no references to "this
          course" / "the previous module" / repository-specific
          examples.
        - Lead with the concept itself; let the host repository
          frame why it matters.
        - Clear, concise language that reads naturally inserted
          into any pedagogical context.`,
    },
  },
};

export const SCHEMA: Schema = {
  id: 'CONTENT_LIBRARY',
  description:
    'A library of reusable content items that can be linked to other repositories.',
  workflowId: DEFAULT_WORKFLOW.id,
  name: 'Content Library',
  structure: [COLLECTION, ITEM],
  contentContainers: [SECTION],
};
