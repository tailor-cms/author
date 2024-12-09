import type {
  ActivityConfig,
  ContentContainerConfig,
  Schema,
} from '@tailor-cms/interfaces/schema';
import { ContentContainerType } from '@tailor-cms/content-container-collection/types.js';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';

import { DEFAULT_WORKFLOW } from '../workflows/default.workflow';

enum ActivityType {
  Category = 'CATEGORY',
  Question = 'QUESTION',
  Response = 'RESPONSE',
}

const CATEGORY: ActivityConfig = {
  type: ActivityType.Category,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Category',
  color: '#5187C7',
  subLevels: [ActivityType.Category, ActivityType.Question],
  ai: {
    definition: `
      Categories are a way to organize questions.
      Q&A should be organized in a way that makes it easy for users to find the
      information they need. Categories can be nested if needed.`,
  },
};

const QUESTION: ActivityConfig = {
  type: ActivityType.Question,
  isTrackedInWorkflow: true,
  label: 'Question',
  color: '#08A9AD',
  contentContainers: [ActivityType.Response],
  ai: {
    definition: `
      Question represents individual question a user might have.
      It should be clear, concise, and easy to understand. Question should
      always end with a question mark.`,
  },
};

const RESPONSE: ContentContainerConfig = {
  type: ActivityType.Response,
  templateId: ContentContainerType.Default,
  label: 'Response',
  types: [
    { id: ContentElementType.HtmlDefault },
    { id: ContentElementType.Image },
  ],
  ai: {
    definition: `
      Response should clearly and concisely answer to the question it is
      related to.`,
    outputRules: {
      prompt: `
        Try to answer the questions as clearly as possible.
        Response text should be in HTML format.`,
      useDalle: false,
    },
  },
};

export const SCHEMA: Schema = {
  id: 'Q&A_SCHEMA',
  description:
    'A structured Q&A repository with organized categories and questions.',
  workflowId: DEFAULT_WORKFLOW.id,
  name: 'Q&A',
  structure: [CATEGORY, QUESTION],
  contentContainers: [RESPONSE],
};
