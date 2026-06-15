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
  color: OUTLINE_COLOR.NEUTRAL_1,
  ai: {
    definition: `
      Modules group related Learning Bits into a coherent path.
      A Module sets the theme; the Learning Bits inside teach the
      individual concepts. Modules can nest when a domain has
      sub-areas worth surfacing.`,
  },
};

const LearningBit: ActivityConfig = {
  type: ActivityType.LearningBit,
  label: 'Learning Bit',
  contentContainers: [ContentContainerType.StructuredContent],
  rootLevel: true,
  isTrackedInWorkflow: true,
  color: OUTLINE_COLOR.ACCENT_1,
  ai: {
    definition: `
      A Learning Bit is a microlearning unit: one focused concept
      taught end-to-end in a short, high-engagement format.
      Includes learning objectives, key takeaways, and brief
      assessment. Designed for quick consumption, not long
      lectures.`,
  },
};

const StructuredContentContainer: ContentContainerConfig = {
  templateId: ContentContainerType.StructuredContent,
  type: ContentContainerType.StructuredContent,
  label: 'Structured content',
  ai: {
    definition:
      'Learning Bit content is organized into structured content sections.',
    outputRules: {
      prompt: `
        - Microlearning shape: this Learning Bit is meant for
          short, high-engagement consumption. Stay focused; do
          not pad to fill space.
        - Teach the audience: clear explanations, friendly tone,
          progressive complexity, current information.`,
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
  contentElementConfig: [
    {
      name: 'Content Elements',
      items: [
        ContentElementType.TiptapHtml,
        ContentElementType.Image,
      ],
    },
    {
      name: 'Assessments',
      config: { isGradable: true },
      items: [
        ContentElementType.MultipleChoice,
        ContentElementType.SingleChoice,
      ],
    },
    {
      name: 'Nongraded questions',
      config: { isGradable: false },
      items: [
        ContentElementType.MultipleChoice,
        ContentElementType.SingleChoice,
      ],
    },
  ],
};

export const SCHEMA: Schema = {
  id: 'HEAS_SCHEMA',
  name: 'High Engagement @ Scale course',
  description: 'Structured High Engagement @ Scale course structure',
  workflowId: DEFAULT_WORKFLOW.id,
  feedback: {
    rubrics: ['HEAS', 'COGNITIVE_DEPTH', 'ACCESSIBILITY', 'READINESS'],
  },
  structure: [Module, LearningBit],
  contentContainers: [StructuredContentContainer],
  meta: [
    {
      key: 'heasRating',
      type: MetaInputType.HeasRating,
      label: 'HE@S rating',
      hideOnCreate: false,
    },
  ],
  elementMeta: [
    {
      type: ContentElementType.Video,
      inputs: [
        {
          key: 'transcript',
          type: MetaInputType.File,
          label: 'Video Transcript',
          placeholder: 'Click to add video transcript',
          validate: {
            ext: ['pdf'],
          },
        },
      ],
    },
  ],
};
