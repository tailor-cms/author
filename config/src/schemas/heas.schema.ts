import type {
  ActivityConfig,
  ContentContainerConfig,
  Schema,
} from '@tailor-cms/interfaces/schema';
import type { Activity } from '@tailor-cms/interfaces/activity';
import { ContentContainerType } from '@tailor-cms/content-container-collection/types.js';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';
import type { Repository } from '@tailor-cms/interfaces/repository';

import { OUTLINE_COLOR } from '../colors';
import { DEFAULT_WORKFLOW } from '../workflows/default.workflow';

const guidelines = (
  _repository: Repository,
  contentContainers: Activity[],
  contentElements: ContentElement[],
  ceRegistry,
) => {
  const sections = contentContainers?.filter((it) => it.type === 'SECTION');
  const questions = ceRegistry.questions?.map((it) => it.type);
  const hasVideo = contentElements?.some((it) => it.type === ContentElementType.Video);

  return [
    {
      id: '1',
      icon: 'mdi-target',
      title: 'Define Learning Objectives',
      description: `Improve on Learner-Centered Content by defining what learners
      will gain by engaging with this content. This helps them start out with a
      clear goal and focus.`,
      metric: { learnerCenteredContent: 2 },
      isDone: () => {
        return sections?.every((it) => it.data.learningObjectives?.length > 0);
      },
    },
    {
      id: '2',
      icon: 'mdi-link-variant',
      title: 'Link to Related Resources',
      description: `Improve on Learner-Centered Content by linking to additional
      materials, such as articles, videos, or tools that further learners'
      understanding or provide alternative perspectives on the topic.`,
      metric: { learnerCenteredContent: 1 },
      isDone: () => {
        return sections?.every((it) => it.data.relatedResources?.trim()?.length > 0);
      },
    },
    {
      id: '3',
      icon: 'mdi-help-circle',
      title: 'Add a Knowledge Check',
      description: `Improve on Active Learning by incorporating a question or
      reflection prompt to help learners apply and test their understanding of
      the material.`,
      metric: { activeLearning: 2 },
      isDone: () => {
        return contentElements?.some((it) => questions?.includes(it.type));
      },
    },
    {
      id: '4',
      icon: 'mdi-text-box',
      title: 'Add a Key Takeaway',
      description: `
      Improve on Real-World Outcomes by offering a summary, guide,
      or other resource that learners can keep for future reference.`,
      metric: { realWorldOutcomes: 2 },
      isDone: () => {
        return sections?.every((it) => it.data.keyTakeaways?.trim()?.length > 0);
      },
    },
    ...hasVideo
      ? [{
          id: '5',
          icon: 'mdi-file-document',
          title: 'Add a Video Transcript',
          description: `Improve on Unbounded Inclusion by ensuring all learners,
          including those with auditory impairments or who prefer reading, can fully
          engage with the content.`,
          metric: {
            learnerCenteredContent: 0,
            activeLearning: 0,
            unboundedInclusion: 2,
            communityConnections: 1,
            realWorldOutcomes: 0,
          },
          isDone: () => {
            return contentElements?.every(
              (it) => it.type !== ContentElementType.Video || it.meta.transcript,
            );
          },
        }]
      : [],
  ];
};

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
  guidelines,
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
