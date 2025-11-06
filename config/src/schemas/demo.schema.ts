import type {
  ActivityConfig,
  ContentContainerConfig,
  Schema,
} from '@tailor-cms/interfaces/schema';
import { ContentContainerType } from '@tailor-cms/content-container-collection/types.js';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

import { DEFAULT_WORKFLOW } from '../workflows/default.workflow';

const SchemaId = 'DEMO_SCHEMA';

enum ActivityType {
  // Outline
  Module = 'MODULE',
  Page = 'PAGE',
  // Content containers
  Section = 'SECTION',
}

const ModuleConfig: ActivityConfig = {
  type: ActivityType.Module,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Module',
  color: '#5187C7',
  subLevels: [ActivityType.Page],
  ai: {
    definition: `
      Modules are a way to organize knowledge into chunks that are easier to
      understand and learn`,
  },
  meta: [
    {
      key: 'posterImage',
      type: MetaInputType.File,
      label: 'Poster Image',
      placeholder: 'Click to upload a poster image',
      icon: 'mdi-image',
      validate: {
        ext: ['jpg', 'jpeg', 'png'],
      },
      hideOnCreate: true,
      showPreview: true,
    },
    {
      key: 'description',
      type: MetaInputType.Textarea,
      label: 'Description',
      placeholder: 'Enter module description',
    },
    {
      key: 'estimatedTime',
      type: MetaInputType.TextField,
      label: 'Estimated time (minutes)',
      placeholder: 'Enter estimated time to complete the module',
      inputType: 'number',
      validate: {
        min: 1,
      },
    },
  ],
};

const PageConfig: ActivityConfig = {
  type: ActivityType.Page,
  isTrackedInWorkflow: true,
  label: 'Page',
  ai: {
    definition: `
      Pages contain the actual content that the user will interact with.`,
  },
  color: '#08A9AD',
  contentContainers: [ActivityType.Section],
  meta: [
    {
      key: 'description',
      type: MetaInputType.Textarea,
      label: 'Description',
      placeholder: 'Enter page description',
    },
    {
      key: 'estimatedTime',
      type: MetaInputType.TextField,
      label: 'Estimated time (minutes)',
      placeholder: 'Enter estimated time to complete the page',
      inputType: 'number',
      validate: {
        min: 1,
      },
    },
  ],
};

const SectionConfig: ContentContainerConfig = {
  type: ActivityType.Section,
  templateId: ContentContainerType.Default,
  label: 'Section',
  multiple: true,
  embedElementConfig: [
    ContentElementType.TiptapHtml,
    ContentElementType.Image,
    ContentElementType.Video,
  ],
  contentElementConfig: [
    {
      name: 'Content Elements',
      items: [
        ContentElementType.TiptapHtml,
        ContentElementType.HtmlRaw,
        ContentElementType.Image,
        ContentElementType.Video,
        ContentElementType.Embed,
        ContentElementType.Audio,
        ContentElementType.Break,
        ContentElementType.Pdf,
        ContentElementType.Accordion,
        ContentElementType.Modal,
        ContentElementType.Carousel,
        ContentElementType.MuxVideo,
      ],
    },
    {
      name: 'Assessments',
      config: { isGradable: true },
      items: [
        ContentElementType.MultipleChoice,
        ContentElementType.SingleChoice,
        ContentElementType.TextResponse,
        ContentElementType.NumericalResponse,
        ContentElementType.TrueFalse,
        ContentElementType.MatchingQuestion,
        ContentElementType.FillBlank,
        ContentElementType.DragDrop,
      ],
    },
    {
      name: 'Nongraded questions',
      config: { isGradable: false },
      items: [
        ContentElementType.MultipleChoice,
        ContentElementType.SingleChoice,
        ContentElementType.TextResponse,
        ContentElementType.TrueFalse,
        ContentElementType.FillBlank,
      ],
    },
  ],
  ai: {
    definition: 'Sections are a way to organize content within a Page.',
    outputRules: {
      prompt: `
        - Split the content contextually to couple of { "content": "" } blocks
          based on the context. Headings might be a good place to split.
          Dont include more than 3 headings.
        - Use at least 1000 words and don't exceed 2000 words.
        - Format the content as a HTML with suitable tags and headings.
        You are trying to teach the audience, so make sure the content is easy to
        understand, has a friendly tone and is engaging to the reader.
        Make sure to include the latest relevant information on the topic.`,
      useDalle: true,
    },
  },
};

export const SCHEMA: Schema = {
  id: SchemaId,
  workflowId: DEFAULT_WORKFLOW.id,
  name: 'Demo',
  description: 'A classic course structure featuring modules and pages.',
  meta: [
    {
      key: 'posterImage',
      type: MetaInputType.File,
      label: 'Poster Image',
      placeholder: 'Click to upload a poster image',
      icon: 'mdi-image',
      validate: {
        ext: ['jpg', 'jpeg', 'png'],
      },
      hideOnCreate: true,
      showPreview: true,
    },
    {
      key: 'estimatedTime',
      type: MetaInputType.TextField,
      label: 'Estimated time (minutes)',
      placeholder: 'Enter estimated time to complete the course',
      inputType: 'number',
      validate: {
        min: 1,
      },
    },
  ],
  structure: [ModuleConfig, PageConfig],
  contentContainers: [SectionConfig],
};
