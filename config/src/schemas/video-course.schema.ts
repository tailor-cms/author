import type {
  ActivityConfig,
  ContentContainerConfig,
  Schema,
} from '@tailor-cms/interfaces/schema';
import { ContentContainerType } from '@tailor-cms/content-container-collection/types.js';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

import { DEFAULT_WORKFLOW } from '../workflows/default.workflow';

const SchemaId = 'VIDEO_COURSE_SCHEMA';

enum ActivityType {
  // Outline
  Chapter = 'CHAPTER',
  Lesson = 'LESSON',
  // Content containers
  LessonContent = 'LESSON_CONTENT',
  VideoUnit = 'VIDEO_UNIT',
}

const LessonContentContainer: ContentContainerConfig = {
  templateId: ContentContainerType.StructuredContent,
  type: ActivityType.LessonContent,
  label: 'Lesson Content',
  multiple: false,
  config: {
    [ActivityType.VideoUnit]: {
      label: 'Video unit',
      icon: 'mdi-video-outline',
      contentElementConfig: [ContentElementType.MuxVideo],
    },
  },
};

const ChapterConfig: ActivityConfig = {
  type: ActivityType.Chapter,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Chapter',
  color: '#5187C7',
  subLevels: [ActivityType.Lesson],
  ai: {
    definition: `
      Chapters are thematic groupings that organize video lessons into logical
      units. They help learners navigate the course by breaking down the
      material into focused topics or skill areas.`,
  },
};

const LessonConfig: ActivityConfig = {
  type: ActivityType.Lesson,
  isTrackedInWorkflow: true,
  label: 'Lesson',
  ai: {
    definition: `
      Lessons are individual video-based learning units that deliver focused
      instructional content. Each lesson contains video content that teaches
      specific concepts, skills, or topics within the course curriculum.`,
  },
  color: '#08A9AD',
  contentContainers: [ActivityType.LessonContent],
  meta: [
    {
      key: 'description',
      type: MetaInputType.Textarea,
      label: 'Description',
      placeholder: 'Enter lesson description',
    },
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
    {
      key: 'estimatedTime',
      type: MetaInputType.TextField,
      label: 'Estimated time (minutes)',
      placeholder: 'Enter estimated time to complete the lesson',
      inputType: 'number',
    },
  ],
};

export const SCHEMA: Schema = {
  id: SchemaId,
  workflowId: DEFAULT_WORKFLOW.id,
  name: 'Video course',
  description: 'A video-based course structure featuring chapters and video lessons.',
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
    {
      key: 'estimatedTime',
      type: MetaInputType.TextField,
      label: 'Estimated time (minutes)',
      placeholder: 'Enter estimated time to complete the course',
      inputType: 'number',
    },
  ],
  structure: [ChapterConfig, LessonConfig],
  contentContainers: [LessonContentContainer],
};
