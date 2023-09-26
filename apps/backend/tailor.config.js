const LXP_WORKFLOW = {
  id: 'LXP_WORKFLOW',
  statuses: [
    { id: 'TODO', label: 'Todo', default: true, color: '#E91E63' },
    { id: 'IN_PROGRESS', label: 'In progress', color: '#ff0000' },
    { id: 'REVIEW', label: 'Review', color: '#ff0000' },
    { id: 'DONE', label: 'Done', color: '#ff0000' }
  ]
};

const ACTIVITY_TYPE = {
  FOLDER: 'FOLDER',
  PAGE: 'PAGE'
};

const CONTENT_CONTAINERS = {
  SECTION_CONTAINER: {
    templateId: 'SECTION_CONTAINER',
    type: 'SECTION_CONTAINER',
    label: 'Section Container',
    required: true
  }
};

const FOLDER = {
  type: ACTIVITY_TYPE.FOLDER,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Folder',
  color: '#5187C7',
  subLevels: [
    ACTIVITY_TYPE.FOLDER,
    ACTIVITY_TYPE.PAGE
  ]
};

const PAGE = {
  type: ACTIVITY_TYPE.PAGE,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Page',
  color: '#08A9AD',
  contentContainers: [CONTENT_CONTAINERS.SECTION_CONTAINER.type]
};

const HARVARD_LXP_SCHEMA = {
  id: 'HARVARD_LXP_SCHEMA',
  workflowId: LXP_WORKFLOW.id,
  name: 'LXP Course',
  meta: [
    {
      key: 'posterImage',
      type: 'FILE',
      label: 'Poster image',
      placeholder: 'Click to upload a poster image',
      validate: {
        ext: ['jpg', 'jpeg', 'png']
      }
    },
    {
      key: 'posterImageAlt',
      type: 'TEXTAREA',
      label: 'Poster image alt text'
    }
  ],
  structure: [
    FOLDER,
    PAGE
  ],
  contentContainers: [CONTENT_CONTAINERS.SECTION_CONTAINER],
  elementMeta: [{
    type: 'IMAGE',
    inputs: [{
      key: 'alt',
      type: 'TEXTAREA',
      label: 'Alt text'
    }]
  },
  {
    type: 'CDA_VIDEO',
    inputs: [
      {
        key: 'title',
        type: 'TEXTAREA',
        label: 'Title (*not visible to learners)',
        validate: {
          max: 255
        }
      },
      {
        key: 'captions',
        type: 'FILE',
        label: 'Captions',
        placeholder: 'Click to upload closed captions',
        validate: {
          ext: ['vtt', 'srt']
        }
      },
      {
        key: 'transcript',
        type: 'FILE',
        label: 'Transcript',
        placeholder: 'Click to upload a transcript',
        validate: {
          ext: ['doc', 'docx', 'pdf', 'txt']
        }
      },
      {
        key: 'thumbnail',
        type: 'FILE',
        label: 'Thumbnail',
        placeholder: 'Click to upload a thumbnail',
        validate: {
          ext: ['jpg', 'jpeg', 'png']
        }
      }
    ]
  }]
};

export const SCHEMAS = [HARVARD_LXP_SCHEMA];
export const WORKFLOWS = [LXP_WORKFLOW];

export default {
  SCHEMAS,
  WORKFLOWS
}
