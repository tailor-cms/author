const EXAMPLE_WORKFLOW = {
  id: 'EXAMPLE_WORKFLOW',
  statuses: [
    { id: 'TODO', label: 'Todo', default: true, color: '#e91e63' },
    { id: 'IN_PROGRESS', label: 'In progress', color: '#ff0000' },
    { id: 'REVIEW', label: 'Review', color: '#ff0000' },
    { id: 'DONE', label: 'Done', color: '#ff0000' },
  ],
};

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
};

const PAGE = {
  type: ACTIVITY_TYPE.PAGE,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Page',
  color: '#08A9AD',
  contentContainers: [ACTIVITY_TYPE.SECTION],
};

const SECTION_CONTAINER = {
  type: ACTIVITY_TYPE.SECTION,
  label: 'Section',
  multiple: true,
  types: ['JODIT_HTML', 'IMAGE', 'EMBED', 'PDF'],
};

const EXAMPLE_SCHEMA = {
  id: 'EXAMPLE_SCHEMA',
  workflowId: EXAMPLE_WORKFLOW.id,
  name: 'Course',
  meta: [
    {
      key: 'posterImage',
      type: 'FILE',
      label: 'Poster image',
      placeholder: 'Click to upload a poster image',
      validate: {
        ext: ['jpg', 'jpeg', 'png'],
      },
    },
  ],
  structure: [MODULE, PAGE],
  contentContainers: [SECTION_CONTAINER],
  elementMeta: [
    {
      type: 'IMAGE',
      inputs: [
        {
          key: 'alt',
          type: 'TEXTAREA',
          label: 'Alt text',
        },
      ],
    },
  ],
};

export const SCHEMAS = [EXAMPLE_SCHEMA];
export const WORKFLOWS = [EXAMPLE_WORKFLOW];

export default {
  SCHEMAS,
  WORKFLOWS,
};
