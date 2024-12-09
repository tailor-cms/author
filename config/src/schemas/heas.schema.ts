import type {
  ActivityConfig,
  ContentContainer,
  Schema,
} from '@tailor-cms/interfaces/schema';
import { ContentContainerType } from '@tailor-cms/content-container-collection/types.js';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

import { DEFAULT_WORKFLOW } from '../workflows/default.workflow';

const checklist = (_repository, contentContainers, contentElements, ceRegistry) => {
  const sections = contentContainers?.filter((it: any) => it.type === 'SECTION');
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
      metric: {
        learnerCenteredContent: 2,
        activeLearning: 0,
        unboundedInclusion: 0,
        communityConnections: 0,
        realWorldOutcomes: 0,
      },
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
      metric: {
        learnerCenteredContent: 1,
        activeLearning: 0,
        unboundedInclusion: 0,
        communityConnections: 0,
        realWorldOutcomes: 0,
      },
      isDone: () => {
        const sections = contentContainers?.filter(
          (it: any) => it.type === 'SECTION',
        );
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
      metric: {
        learnerCenteredContent: 0,
        activeLearning: 2,
        unboundedInclusion: 0,
        communityConnections: 0,
        realWorldOutcomes: 0,
      },
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
      metric: {
        learnerCenteredContent: 0,
        activeLearning: 0,
        unboundedInclusion: 0,
        communityConnections: 0,
        realWorldOutcomes: 2,
      },
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
  checklist,
  ai: {
    definition: 'Learning Bit represents a small piece of knowledge.',
  },
};

const StructuredContentContainer: ContentContainer = {
  templateId: ContentContainerType.StructuredContent,
  type: ContentContainerType.StructuredContent,
  label: 'Structured content',
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
  elementMeta: [
    {
      type: ContentElementType.Video,
      inputs: [
        {
          key: 'transcript',
          type: MetaInputType.File,
          label: 'Video Transcript',
          placeholder: 'Click to upload video transcript',
          validate: {
            ext: ['pdf'],
          },
        },
      ],
    },
  ],
};
