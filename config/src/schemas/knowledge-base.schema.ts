import type {
  ActivityConfig,
  ContentContainerConfig,
  Schema,
} from '@tailor-cms/interfaces/schema';
import { ContentMode } from '@tailor-cms/interfaces/schema';
import { ContentContainerType } from '@tailor-cms/content-container-collection/types.js';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';

import { DEFAULT_WORKFLOW } from '../workflows/default.workflow';

enum ActivityType {
  Category = 'CATEGORY',
  Entry = 'ENTRY',
  Section = 'SECTION',
}

const CATEGORY: ActivityConfig = {
  type: ActivityType.Category,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Category',
  color: '#5187C7',
  subLevels: [ActivityType.Category, ActivityType.Entry],
  ai: {
    definition: `
      Categories group related Entries by topic area. A Category
      defines what kind of questions belong here, but does not hold
      content itself. Categories can nest when a topic area has
      sub-topics worth distinguishing.`,
  },
};

const ENTRY: ActivityConfig = {
  type: ActivityType.Entry,
  isTrackedInWorkflow: true,
  label: 'Entry',
  color: '#08A9AD',
  contentContainers: [ActivityType.Section],
  ai: {
    definition: `
      An Entry is a single self-contained reference topic the
      reader looks up when they need an answer. Each Entry covers
      one well-defined concept, term, procedure, or FAQ. Reads
      lookup-first: scannable, terse, no preamble.`,
  },
};

const SECTION: ContentContainerConfig = {
  type: ActivityType.Section,
  templateId: ContentContainerType.Default,
  label: 'Section',
  contentElementConfig: [
    ContentElementType.TiptapHtml,
    ContentElementType.Image,
  ],
  ai: {
    definition: 'Entry content is organized into sections.',
    outputRules: {
      prompt: `
        - Reference shape: lookup-first. Lead with the direct
          answer or definition; elaborate only if it adds clarity.
          No greeting, no "in this section we'll cover..." framing.
        - Prefer scannable, lookup-oriented content over walls of
          prose; a short Entry needs no sectioning at all.`,
    },
  },
};

export const SCHEMA: Schema = {
  id: 'KNOWLEDGE_BASE',
  description:
    'A structured knowledge base with organized categories and entries.',
  workflowId: DEFAULT_WORKFLOW.id,
  name: 'Knowledge Base',
  ai: { contentMode: ContentMode.Reference },
  structure: [CATEGORY, ENTRY],
  contentContainers: [SECTION],
};
