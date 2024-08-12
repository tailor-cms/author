import { DEFAULT_WORKFLOW } from './default-workflow';

const ACTIVITY_TYPE = {
  MODULE: 'MODULE',
  PAGE: 'PAGE',
  SECTION: 'SECTION',
};

const MODULE = {
  type: ACTIVITY_TYPE.MODULE,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Module',
  color: '#5187C7',
  subLevels: [ACTIVITY_TYPE.MODULE, ACTIVITY_TYPE.PAGE],
  ai: {
    definition: `
      Modules are a way to organize knowledge into chunks that are easier to
      understand and learn. Modules can be nested if needed.`,
  },
  relationships: [
    {
      type: 'prerequisites',
      label: 'Prerequisites',
      multiple: true,
      searchable: true,
      allowEmpty: true,
      placeholder: 'Click to select',
      allowCircularLinks: false,
      allowInsideLineage: true,
      allowedTypes: [ACTIVITY_TYPE.MODULE],
    },
  ],
};

const PAGE = {
  type: ACTIVITY_TYPE.PAGE,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Page',
  ai: {
    definition: `
      Pages contain the actual content that the user will interact with.`,
  },
  color: '#08A9AD',
  contentContainers: [ACTIVITY_TYPE.SECTION],
};

const SECTION_CONTAINER = {
  type: ACTIVITY_TYPE.SECTION,
  templateId: 'DEFAULT',
  label: 'Section',
  multiple: true,
  types: ['CE_HTML_DEFAULT', 'CE_IMAGE', 'CE_MULTIPLE_CHOICE'],
  categories: [
    {
      name: 'Questions',
      icon: 'mdi-help-rhombus',
      types: ['CE_MULTIPLE_CHOICE'],
    },
  ],
  ai: {
    definition: 'Sections are a way to organize content within a Page.',
    outputRules: {
      prompt: `
        - Split the content contextually to couple of { "content": "" } blocks
          based on the context. Headings might be a good place to split.
          Dont include more than 3 headings.
        - Use at least 1000 words and don't exceed 2000 words.
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
  id: 'COURSE_SCHEMA',
  workflowId: DEFAULT_WORKFLOW.id,
  name: 'Course',
  meta: [
    {
      key: 'posterImage',
      type: 'FILE',
      label: 'Poster image',
      placeholder: 'Click to upload a poster image',
      icon: 'mdi-image',
      validate: {
        ext: ['jpg', 'jpeg', 'png'],
        required: true,
      },
    },
    {
      key: 'test',
      type: 'TEXTAREA',
      label: 'Test',
      placeholder: 'Click to test',
      validate: {
        required: true,
      },
    },
  ],
  structure: [MODULE, PAGE],
  contentContainers: [SECTION_CONTAINER],
  elementMeta: [
    {
      type: 'CE_IMAGE',
      inputs: [
        {
          key: 'captions',
          type: 'TEXTAREA',
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
          allowedTypes: ['CE_IMAGE'],
        },
      ],
    },
    {
      type: 'CE_HTML_DEFAULT',
      relationships: [
        {
          key: 'related',
          label: 'Related Content',
          multiple: true,
          placeholder: 'Click to select',
          allowedTypes: ['CE_HTML_DEFAULT', 'CE_IMAGE'],
          filters: [(optionEl, currentEl) => optionEl.id !== currentEl.id],
        },
        {
          key: 'prerequisites',
          label: 'Prerequisites',
          multiple: true,
          placeholder: 'Click to select',
          allowedTypes: ['CE_HTML_DEFAULT'],
        },
      ],
    },
  ],
};
