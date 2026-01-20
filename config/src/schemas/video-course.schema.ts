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
  Section = 'SECTION',
  Lesson = 'LESSON',
  // Content containers
  VideoContent = 'VIDEO_CONTENT',
}

const VideoContentContainer: ContentContainerConfig = {
  templateId: ContentContainerType.Default,
  type: ActivityType.VideoContent,
  label: 'Video content',
  multiple: false,
  displayHeading: true,
  config: { disableAi: true },
  required: true,
  contentElementConfig: [
    {
      name: 'Video Elements',
      items: [ContentElementType.MuxVideo, ContentElementType.Video],
    },
  ],
};

const SectionConfig: ActivityConfig = {
  type: ActivityType.Section,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Section',
  color: '#5187C7',
  subLevels: [ActivityType.Lesson],
  ai: {
    definition: `
      Sections are thematic groupings that organize video lessons into logical
      chapters or units. They help learners navigate the course by breaking down
      the material into focused topics or skill areas.`,
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
  contentContainers: [ActivityType.VideoContent],
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
      placeholder: 'Enter estimated time to complete the page',
      inputType: 'number',
    },
  ],
};

export const SCHEMA: Schema = {
  id: SchemaId,
  workflowId: DEFAULT_WORKFLOW.id,
  name: 'Video course',
  description: 'A video-based course structure featuring sections and video lessons.',
  meta: [
    {
      key: 'thumbnailImage',
      type: MetaInputType.File,
      label: 'Thumbnail Image',
      placeholder: 'Click to upload a thumbnail image',
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
  ],
  structure: [SectionConfig, LessonConfig],
  contentContainers: [VideoContentContainer],
};
