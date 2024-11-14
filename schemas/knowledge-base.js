import { DEFAULT_WORKFLOW } from './default-workflow.js';

const ACTIVITY_TYPE = {
  CATEGORY: 'CATEGORY',
  ENTRY: 'ENTRY',
  SECTION: 'SECTION',
};

const CATEGORY = {
  type: ACTIVITY_TYPE.CATEGORY,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Category',
  color: '#5187C7',
  subLevels: [ACTIVITY_TYPE.CATEGORY, ACTIVITY_TYPE.ENTRY],
  ai: {
    definition: 'Categories are a way to organize content.',
  },
};

const ENTRY = {
  type: ACTIVITY_TYPE.ENTRY,
  isTrackedInWorkflow: true,
  label: 'Entry',
  color: '#08A9AD',
  contentContainers: [ACTIVITY_TYPE.SECTION],
  ai: {
    definition: 'Entry represents a Topic within a Knowledge Base Category.',
  },
};

const SECTION = {
  type: ACTIVITY_TYPE.SECTION,
  templateId: 'DEFAULT',
  label: 'Section',
  types: ['CE_HTML_DEFAULT', 'CE_IMAGE'],
  ai: {
    definition: 'Page content is organized into sections.',
    outputRules: {
      prompt: `
        - Split the content contextually to couple of { "content": "" } blocks
          based on the context. Headings might be a good place to split.
          Dont include more than 3 headings.
        - Try to use at least 2000 words and don't exceed 4000 words.
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

export const SCHEMA = {
  id: 'KNOWLEDGE_BASE',
  description:
    'A structured knowledge base with organized categories and entries.',
  workflowId: DEFAULT_WORKFLOW.id,
  name: 'Knowledge Base',
  structure: [CATEGORY, ENTRY],
  contentContainers: [SECTION],
};
