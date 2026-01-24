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
    definition: 'Collections organize reusable content items in the library.',
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
        - Create educational content that can be reused across multiple courses.
        - Format the content as HTML with suitable tags and headings.
        - Make the content modular and self-contained.
        - Use clear, concise language suitable for reuse in different contexts.`,
      useDalle: false,
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
  contentContainers: [CONTENT],
};
