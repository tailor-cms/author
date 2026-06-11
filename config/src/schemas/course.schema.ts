import type {
  ActivityConfig,
  ContentContainerConfig,
  Schema,
} from '@tailor-cms/interfaces/schema';
import { ContentContainerType } from '@tailor-cms/content-container-collection/types.js';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

import { OUTLINE_COLOR } from '../colors';
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
  color: OUTLINE_COLOR.NEUTRAL_1,
  subLevels: [ActivityType.Module, ActivityType.Page],
  ai: {
    definition: `
      Modules are a way to organize knowledge into chunks that are easier to
      understand and learn. Modules can be nested if needed.`,
  },
  meta: [
    {
      type: MetaInputType.File,
      key: 'thumbnail',
      label: 'Thumbnail',
      placeholder: 'Click to add a thumbnail image',
      showPreview: true,
      validate: { ext: ['jpg', 'jpeg', 'png'] },
    },
  ],
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
      Pages are leaf-level learning units inside a Module. Each Page
      teaches a single focused topic end-to-end: introduce the
      concept, explain it, illustrate with examples, optionally
      assess. A Page is the smallest unit a learner can complete in
      one sitting.`,
  },
  color: OUTLINE_COLOR.ACCENT_1,
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
        ContentElementType.MuxVideo,
        ContentElementType.Embed,
        ContentElementType.Audio,
        ContentElementType.File,
        ContentElementType.Pdf,
        ContentElementType.Break,
        ContentElementType.Accordion,
        ContentElementType.Modal,
        ContentElementType.Carousel,
        ContentElementType.Sequence,
        ContentElementType.Flashcards,
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
        - You are teaching the audience: clear explanations,
          friendly tone, engaging delivery, current information.`,
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
  i18n: {
    enabled: true,
    languages: [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
    ],
    defaultLanguage: 'en',
  },
  meta: [
    {
      key: 'posterImage',
      type: MetaInputType.File,
      label: 'Poster Image',
      placeholder: 'Click to add a poster image',
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
