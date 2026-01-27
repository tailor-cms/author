import type {
  ActivityConfig,
  ContentContainerConfig,
  Schema,
} from '@tailor-cms/interfaces/schema';
import { ContentContainerType } from '@tailor-cms/content-container-collection/types.js';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

import { DEFAULT_WORKFLOW } from '../workflows/default.workflow';

const SchemaId = 'PT_SCHEMA_V2';

enum ActivityType {
  // Outline
  Module = 'MODULE',
  Topic = 'TOPIC',
  Practice = 'PRACTICE',
  // Content containers
  SectionContainer = 'SECTION_CONTAINER',
  Section = 'DEFAULT_SECTION',
  Scenario = 'SCENARIO',
}

const baseMeta = [
  {
    key: 'description',
    type: MetaInputType.Textarea,
    label: 'Description',
    placeholder: 'Description',
  },
  {
    key: 'estimatedTime',
    type: MetaInputType.TextField,
    label: 'Estimated time (minutes)',
    placeholder: 'Enter estimated time in minutes',
    inputType: 'number',
  },
  {
    key: 'tags',
    type: MetaInputType.Combobox,
    label: 'Tags',
    placeholder: 'Tags',
    multiple: true,
    options: [],
  },
];

const sectionMeta = [
  {
    key: 'title',
    type: MetaInputType.TextField,
    label: 'Title',
    placeholder: 'Title',
  },
  ...baseMeta,
];

const outlineMeta = [
  ...baseMeta,
  {
    key: 'thumbnailImage',
    type: MetaInputType.File,
    label: 'Thumbnail Image',
    placeholder: 'Click to upload a thumbnail image',
    icon: 'mdi-image',
    validate: {
      ext: ['jpg', 'jpeg', 'png'],
    },
    showPreview: true,
  },
  {
    key: 'keyTakeaways',
    type: MetaInputType.Html,
    label: 'Key Takeaways',
    placeholder: 'Key Takeaways',
  },
  {
    key: 'summary',
    type: MetaInputType.File,
    label: 'Summary Document',
    placeholder: 'Click to upload a summary document',
    icon: 'mdi-file',
    validate: {
      ext: ['pdf'],
    },
  },
];

const ModuleConfig: ActivityConfig = {
  type: ActivityType.Module,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Module',
  color: '#5187C7',
  subLevels: [ActivityType.Module, ActivityType.Topic, ActivityType.Practice],
  meta: [...outlineMeta],
  ai: {
    definition: `
      Modules are a way to organize knowledge into chunks that are easier to
      understand and learn. Modules can be nested if needed.`,
  },
};

const TopicConfig: ActivityConfig = {
  type: ActivityType.Topic,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Topic',
  meta: [...outlineMeta],
  ai: {
    definition: `
      Topics contain the actual content that the user will interact with.`,
  },
  color: '#08A9AD',
  contentContainers: [ActivityType.SectionContainer],
};

const PracticeConfig: ActivityConfig = {
  type: ActivityType.Practice,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Practice',
  meta: [...outlineMeta],
  ai: {
    definition: `
      Practices contain guided exercises for learners to apply their knowledge.`,
  },
  color: '#CDDC39',
  contentContainers: [ActivityType.SectionContainer],
};

const SectionContainer: ContentContainerConfig = {
  templateId: ContentContainerType.StructuredContent,
  type: ActivityType.SectionContainer,
  label: 'Sections',
  required: true,
  displayHeading: false,
  config: {
    [ActivityType.Section]: {
      label: 'Section',
      meta: () => [...sectionMeta],
    },
    [ActivityType.Scenario]: {
      label: 'Scenario',
      icon: 'mdi-chart-bubble',
      meta: () => [
        ...sectionMeta,
        {
          type: MetaInputType.Select,
          key: 'difficulty',
          label: 'Difficulty Level',
          placeholder: 'Select...',
          options: [
            { value: 'EASY', label: 'Easy' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'HARD', label: 'Hard' },
          ],
        },
      ],
      contentElementConfig: [
        {
          name: 'Survey Elements',
          config: { isGradable: false },
          items: [
            ContentElementType.SingleChoice,
            ContentElementType.MultipleChoice,
          ],
        },
      ],
    },
  },
};

export const SCHEMA: Schema = {
  id: SchemaId,
  workflowId: DEFAULT_WORKFLOW.id,
  name: 'Partner training course v2',
  description:
    'A classic course structure featuring modules, topics, and practices.',
  meta: [
    {
      key: 'thumbnailImage',
      type: MetaInputType.File,
      label: 'Thumbnail Image',
      placeholder: 'Click to upload a thumbnail image',
      icon: 'mdi-image',
      validate: {
        ext: ['jpg', 'jpeg', 'png'],
      },
      hideOnCreate: true,
      showPreview: true,
    },
  ],
  structure: [ModuleConfig, TopicConfig, PracticeConfig],
  contentContainers: [SectionContainer],
  elementMeta: [
    {
      type: ContentElementType.Image,
      inputs: [
        {
          key: 'captions',
          type: MetaInputType.Textarea,
          label: 'Captions',
          placeholder: 'Enter captions...',
        },
      ],
    },
  ],
};
