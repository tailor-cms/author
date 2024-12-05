import type {
  ActivityConfig,
  ContentContainer,
  Schema,
} from '@tailor-cms/interfaces/schema';
import { ContentContainerType } from '@tailor-cms/content-container-collection/types.js';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

import { DEFAULT_WORKFLOW } from '../workflows/default.workflow';

enum ActivityType {
  Module = 'MODULE',
  LearningBit = 'LEARNING_BIT',
}

const Module: ActivityConfig = {
  type: ActivityType.Module,
  label: 'Module',
  subLevels: [ActivityType.Module, ActivityType.LearningBit],
  rootLevel: true,
  isTrackedInWorkflow: false,
  color: '#5187C7',
  ai: {
    definition: 'Modules are a way to organize content.',
  },
};

const LearningBit: ActivityConfig = {
  type: ActivityType.LearningBit,
  label: 'Learning Bit',
  contentContainers: [ContentContainerType.StructuredContent],
  rootLevel: true,
  isTrackedInWorkflow: true,
  color: '#08A9AD',
  ai: {
    definition: 'Learning Bit represents a small piece of knowledge.',
  },
};

const StructuredContentContainer: ContentContainer = {
  templateId: ContentContainerType.StructuredContent,
  type: ContentContainerType.StructuredContent,
  label: 'Structured content',
  types: [ContentElementType.HtmlDefault, ContentElementType.Image],
  ai: {
    definition:
      'Learning Bit content is organized into structured content sections.',
    outputRules: {
      prompt: `
        - Split the content contextually to couple of { "content": "" } blocks
          based on the context. Headings might be a good place to split.
          Dont include more than 3 headings.
        - Try to use at least 2000 words.
        - Format the content as a HTML with suitable tags and headings.
        - Apply the folllowing classes to the tags:
          - Apply text-body-2 mb-5 to the paragraphs
          - Apply text-h3 and mb-7 to the headings
        You are trying to teach the audience, so make sure the content is easy to
        understand, has a friendly tone and is engaging to the reader.
        Make sure to include the latest relevant information on the topic.`,
      useDalle: true,
    },
  },
  config: {
    SECTION: {
      label: 'Section',
      meta: () => [
        {
          key: 'learningObjectives',
          type: MetaInputType.Combobox,
          label: 'Learning Objectives',
          placeholder: 'Learning Objectives',
          multiple: true,
          options: [],
        },
        {
          key: 'keyTakeaways',
          type: MetaInputType.Html,
          label: 'Key Takeaways',
          placeholder: 'Key Takeaways',
        },
        {
          key: 'relatedResources',
          type: MetaInputType.Html,
          label: 'Related Resources',
          placeholder: 'Related Resources',
        },
      ],
    },
  },
};

export const SCHEMA: Schema = {
  id: 'HEAS_SCHEMA',
  name: 'High Engagement @ Scale course',
  description: 'Structured High Engagement @ Scale course structure',
  workflowId: DEFAULT_WORKFLOW.id,
  structure: [Module, LearningBit],
  contentContainers: [StructuredContentContainer],
  meta: [
    {
      key: 'haesRating',
      type: MetaInputType.HaesRating,
      label: 'HE@S rating',
      hideOnCreate: false,
    },
  ],
};
