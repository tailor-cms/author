import type {
  ActivityConfig,
  ContentContainerConfig,
  Schema,
} from '@tailor-cms/interfaces/schema';
import { ContentContainerType } from '@tailor-cms/content-container-collection/types.js';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

import { DEFAULT_WORKFLOW } from '../workflows/default.workflow';

const SchemaId = 'COURSE_SCHEMA';

enum ActivityType {
  // Outline
  Module = 'MODULE',
  Page = 'PAGE',
  KnowledgeCheck = 'KNOWLEDGE_CHECK',
  // Content containers
  Section = 'SECTION',
}

const ModuleConfig: ActivityConfig = {
  type: ActivityType.Module,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Module',
  color: '#5187C7',
  subLevels: [ActivityType.Module, ActivityType.Page],
  ai: {
    definition: `
      Modules are a way to organize knowledge into chunks that are easier to
      understand and learn. Modules can be nested if needed.`,
  },
  relationships: [
    {
      type: 'prerequisites',
      label: 'Prerequisites',
      placeholder: 'Click to select',
      multiple: true,
      searchable: true,
      allowEmpty: true,
      allowCircularLinks: false,
      allowInsideLineage: true,
      allowedTypes: [ActivityType.Module],
    },
  ],
};

const PageConfig: ActivityConfig = {
  type: ActivityType.Page,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Page',
  ai: {
    definition: `
      Pages contain the actual content that the user will interact with.`,
  },
  color: '#08A9AD',
  contentContainers: [
    ActivityType.Section,
    ContentContainerType.AssessmentPool,
  ],
  meta: [
    {
      key: 'heasRating',
      type: MetaInputType.HeasRating,
      label: 'HE@S rating',
      reviewable: true,
      hideOnCreate: true,
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
        - Apply the folllowing classes to the tags:
          - Apply text-body-2 mb-5 to the paragraphs
          - Apply text-h3 and mb-7 to the headings
        You are trying to teach the audience, so make sure the content is easy to
        understand, has a friendly tone and is engaging to the reader.
        Make sure to include the latest relevant information on the topic.`,
      useDalle: true,
    },
  },
};

const AssessmentPoolConfig: ContentContainerConfig = {
  type: ContentContainerType.AssessmentPool,
  templateId: ContentContainerType.AssessmentPool,
  label: 'Assessments',
  publishedAs: 'assessments',
  contentElementConfig: [
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
  ],
  ai: {
    definition: `
      Assessment pools are collections of assessments that can be used to
      evaluate the learner's understanding of the material. They can include
      various types of questions and are designed to provide comprehensive
      feedback.`,
    outputRules: {
      prompt: `
      - Format the 'question' content and 'feedback' content as a HTML with
        suitable tags.
      - Apply text-body-2 and mb-5 classes to the paragraph html tags.
      - Unlike 'question' and 'feeback' which are HTML content, 'hint' should
        be plaintext.`,
      isAssessment: true,
    },
  },
};

const ExamConfig: ContentContainerConfig = {
  type: ContentContainerType.Exam,
  templateId: ContentContainerType.Exam,
  label: 'Exam',
  displayHeading: true,
  multiple: true,
  publishedAs: 'exam',
  config: {
    objectives: [`${SchemaId}/${ActivityType.Page}`],
  },
  ai: {
    definition: `
      Exams are comprehensive assessments that evaluate the learner's
      understanding of the material covered in the lesson. They are designed to
      test the learner's knowledge and provide feedback on their progress.`,
  },
};

export const SCHEMA: Schema = {
  id: SchemaId,
  workflowId: DEFAULT_WORKFLOW.id,
  name: 'Course',
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
  ],
  structure: [ModuleConfig, PageConfig],
  contentContainers: [SectionConfig, AssessmentPoolConfig, ExamConfig],
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
      relationships: [
        {
          key: 'related',
          label: 'Related Content',
          multiple: true,
          placeholder: 'Click to select',
          allowedElementConfig: [ContentElementType.Image],
        },
      ],
    },
    {
      type: ContentElementType.TiptapHtml,
      relationships: [
        {
          key: 'related',
          label: 'Related Content',
          multiple: true,
          placeholder: 'Click to select',
          allowedElementConfig: [
            ContentElementType.TiptapHtml,
            ContentElementType.Image,
          ],
          filters: [(optionEl, currentEl) => optionEl.id !== currentEl.id],
        },
        {
          key: 'prerequisites',
          label: 'Prerequisites',
          multiple: true,
          placeholder: 'Click to select',
          allowedElementConfig: [ContentElementType.TiptapHtml],
        },
      ],
    },
  ],
};
