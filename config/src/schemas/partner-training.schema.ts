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

const SchemaId = 'PT_SCHEMA';

enum ActivityType {
  // Outline
  Module = 'MODULE',
  Lesson = 'LESSON',
  // Content containers
  LessonContent = 'LESSON_CONTENT',
  Section = 'SECTION',
  VideoUnit = 'VIDEO_UNIT',
  PodcastUnit = 'PODCAST_UNIT',
  Takeaways = 'TAKEAWAYS',
  RelatedContent = 'RELATED_CONTENT',
  RelatedArticle = 'RELATED_ARTICLE',
  RelatedWebinar = 'RELATED_WEBINAR',
  Scenario = 'SCENARIO',
}

const sectionMeta = [
  {
    key: 'title',
    type: MetaInputType.TextField,
    label: 'Title',
    placeholder: 'Title',
  },
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
    placeholder: 'Enter estimated time to complete the section',
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

const unitMeta = [
  ...sectionMeta,
  {
    key: 'thumbnailImage',
    type: MetaInputType.File,
    label: 'Thumbnail Image',
    placeholder: 'Click to add a thumbnail image',
    icon: 'mdi-image',
    ext: ['jpg', 'jpeg', 'png'],
    showPreview: true,
  },
];

const LessonContentContainer: ContentContainerConfig = {
  templateId: ContentContainerType.StructuredContent,
  type: ActivityType.LessonContent,
  label: 'Lesson content',
  displayHeading: true,
  ai: {
    definition: `
      The main teaching surface for a Lesson, where its mixed-media
      content lives.`,
    outputRules: {
      prompt: `
        - Partner training shape: practical, applied teaching
          aimed at adult professionals.
        - Match each subcontainer to its medium rather than forcing
          everything into written prose.
        - Each subcontainer covers one focused idea. Be concrete and
          example-led; lean on real workplace situations.`,
    },
  },
  config: {
    [ActivityType.Section]: {
      label: 'Section',
      meta: () => [
        ...sectionMeta,
        {
          type: MetaInputType.Switch,
          key: 'accentuate',
          label: 'Accentuate section',
        },
      ],
    },
    [ActivityType.VideoUnit]: {
      label: 'Video unit',
      icon: 'mdi-video-outline',
      meta: () => unitMeta,
      contentElementConfig: [
        {
          name: 'Content Elements',
          items: [
            ContentElementType.MuxVideo,
            ContentElementType.TiptapHtml,
            ContentElementType.Image,
          ],
        },
      ],
    },
    [ActivityType.PodcastUnit]: {
      label: 'Podcast unit',
      icon: 'mdi-speaker-wireless',
      meta: () => unitMeta,
      contentElementConfig: [
        {
          name: 'Content Elements',
          items: [
            ContentElementType.TiptapHtml,
            ContentElementType.Embed,
            ContentElementType.Audio,
            ContentElementType.Image,
          ],
        },
      ],
    },
    [ActivityType.Scenario]: {
      label: 'Scenario',
      icon: 'mdi-chart-bubble',
      meta: () => unitMeta,
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

const relatedContentMeta = [
  {
    key: 'title',
    type: MetaInputType.TextField,
    label: 'Title',
    placeholder: 'Title',
  },
  {
    key: 'description',
    type: MetaInputType.Textarea,
    label: 'Description',
    placeholder: 'Description',
  },
  {
    key: 'thumbnailImage',
    type: MetaInputType.File,
    label: 'Thumbnail Image',
    placeholder: 'Click to add a thumbnail image',
    icon: 'mdi-image',
    ext: ['jpg', 'jpeg', 'png'],
    showPreview: true,
  },
  {
    key: 'url',
    type: MetaInputType.TextField,
    label: 'Url',
    placeholder: 'Url',
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

const RelatedContentContainer: ContentContainerConfig = {
  templateId: ContentContainerType.StructuredContent,
  type: ActivityType.RelatedContent,
  label: 'Related external content',
  displayHeading: true,
  ai: {
    definition: `
      Curated pointers to outside articles and webinars relevant to
      the lesson.`,
    outputRules: {
      prompt: `
        - Each entry is a pointer, not a body of content: fill the
          meta fields rather than writing a body; the renderer
          surfaces the link as a card.
        - Description is one or two sentences explaining why the
          resource is worth the learner's time. No teaser fluff.`,
    },
  },
  config: {
    [ActivityType.RelatedArticle]: {
      label: 'Article',
      icon: 'mdi-post',
      meta: () => relatedContentMeta,
      disableContentElementList: true,
    },
    [ActivityType.RelatedWebinar]: {
      label: 'Webinar',
      icon: 'mdi-laptop-account',
      meta: () => relatedContentMeta,
      disableContentElementList: true,
    },
  },
};

const TakeawaysConfig: ContentContainerConfig = {
  type: ActivityType.Takeaways,
  templateId: ContentContainerType.Default,
  label: 'Takeaways',
  multiple: false,
  displayHeading: true,
  config: { disableAi: true },
  required: true,
  contentElementConfig: [
    {
      name: 'Content Elements',
      items: [ContentElementType.File],
    },
  ],
};

const ModuleConfig: ActivityConfig = {
  type: ActivityType.Module,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Module',
  color: OUTLINE_COLOR.NEUTRAL_1,
  subLevels: [ActivityType.Lesson],
  ai: {
    definition: `
      Modules group Lessons into a coherent learning path for the
      partner audience. A Module sets the theme; the Lessons
      inside teach the individual skills. Geared toward applied
      professional learning, not academic study.`,
  },
  meta: [
    {
      key: 'description',
      type: MetaInputType.Textarea,
      label: 'Description',
      placeholder: 'Enter module description',
    },
    {
      key: 'thumbnailImage',
      type: MetaInputType.File,
      label: 'Thumbnail Image',
      placeholder: 'Click to add a thumbnail image',
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
      placeholder: 'Enter estimated time to complete the module',
      inputType: 'number',
    },
  ],
};

const LessonConfig: ActivityConfig = {
  type: ActivityType.Lesson,
  isTrackedInWorkflow: true,
  label: 'Lesson',
  ai: {
    definition: `
      A Lesson is the unit a partner actually completes: one
      focused skill or topic taught with mixed media (sections,
      video, podcast, scenario). Concludes with related external
      content and key takeaways.`,
  },
  color: OUTLINE_COLOR.ACCENT_1,
  contentContainers: [
    ActivityType.LessonContent,
    ActivityType.RelatedContent,
    ActivityType.Takeaways,
  ],
  meta: [
    {
      key: 'description',
      type: MetaInputType.Textarea,
      label: 'Description',
      placeholder: 'Enter page description',
    },
    {
      key: 'thumbnailImage',
      type: MetaInputType.File,
      label: 'Thumbnail Image',
      placeholder: 'Click to add a thumbnail image',
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
      placeholder: 'Enter estimated time to complete the page',
      inputType: 'number',
    },
  ],
};

export const SCHEMA: Schema = {
  id: SchemaId,
  workflowId: DEFAULT_WORKFLOW.id,
  name: 'Partner training course',
  description: 'A classic course structure featuring modules and lessons.',
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
      key: 'thumbnailImage',
      type: MetaInputType.File,
      label: 'Thumbnail Image',
      placeholder: 'Click to add a thumbnail image',
      icon: 'mdi-image',
      ext: ['jpg', 'jpeg', 'png'],
      hideOnCreate: true,
      showPreview: true,
    },
    {
      key: 'estimatedTime',
      type: MetaInputType.TextField,
      label: 'Estimated time (minutes)',
      placeholder: 'Enter estimated time to complete the course',
      inputType: 'number',
    },
    {
      key: 'author',
      type: MetaInputType.TextField,
      label: 'Author',
      placeholder: 'Enter course author',
    },
  ],
  structure: [ModuleConfig, LessonConfig],
  contentContainers: [
    LessonContentContainer,
    RelatedContentContainer,
    TakeawaysConfig,
  ],
};
