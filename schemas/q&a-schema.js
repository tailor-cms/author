import { DEFAULT_WORKFLOW } from './default-workflow';

const ACTIVITY_TYPE = {
  CATEGORY: 'CATEGORY',
  QUESTION: 'QUESTION',
  RESPONSE: 'RESPONSE',
};

const CATEGORY = {
  type: ACTIVITY_TYPE.CATEGORY,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Category',
  color: '#5187C7',
  subLevels: [ACTIVITY_TYPE.CATEGORY, ACTIVITY_TYPE.QUESTION],
  ai: {
    definition: `
      Categories are a way to organize questions.
      Q&A should be organized in a way that makes it easy for users to find the
      information they need. Categories can be nested if needed.`,
  },
};

const QUESTION = {
  type: ACTIVITY_TYPE.QUESTION,
  isTrackedInWorkflow: true,
  label: 'Question',
  color: '#08A9AD',
  contentContainers: [ACTIVITY_TYPE.RESPONSE],
  ai: {
    definition: `
      Question represents individual question a user might have.
      It should be clear, concise, and easy to understand. Question should
      always end with a question mark.`,
  },
};

const RESPONSE = {
  type: ACTIVITY_TYPE.RESPONSE,
  templateId: 'DEFAULT',
  label: 'Response',
  types: ['CE_HTML_DEFAULT', 'CE_IMAGE'],
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

export const SCHEMA = {
  id: 'Q&A_SCHEMA',
  description:
    'A structured Q&A repository with organized categories and questions.',
  workflowId: DEFAULT_WORKFLOW.id,
  name: 'Q&A',
  structure: [CATEGORY, QUESTION],
  contentContainers: [RESPONSE],
};
