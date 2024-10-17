import { DEFAULT_WORKFLOW } from './default-workflow';

// ----------------------------------------------------
// Meta inputs
// ----------------------------------------------------

const getInputMeta = () => ({
  type: 'INPUT',
  key: 'inputField',
  label: 'Test input',
  placeholder: 'Click to edit...',
  validate: { required: false },
});

const getTextareaMeta = () => ({
  type: 'TEXTAREA',
  key: 'textareaField',
  label: 'Test textarea',
  placeholder: 'Click to edit...',
  validate: { max: 250 },
});

const getSelectMeta = () => ({
  type: 'SELECT',
  key: 'selectField',
  label: 'Test select',
  placeholder: 'Select...',
  options: [
    {
      label: '15min',
      value: 15,
    },
    {
      label: '30min',
      value: 30,
    },
    {
      label: '45min',
      value: 45,
    },
  ],
});

const getMultiselectMeta = () => ({
  type: 'MULTISELECT',
  key: 'multiselectField',
  label: 'Test multiselect',
  options: [
    { value: 'OPT1', label: 'Option 1' },
    { value: 'OPT2', label: 'Option 2' },
    { value: 'OPT3', label: 'Option 3' },
  ],
});

const getSwitchMeta = () => ({
  type: 'SWITCH',
  key: 'switchField',
  label: 'Test switch',
});

const getCheckboxMeta = () => ({
  type: 'CHECKBOX',
  key: 'checkboxField',
  label: 'Test checkbox',
  description: 'Option selected',
});

const getFileMeta = () => ({
  type: 'FILE',
  key: 'fileField',
  label: 'Test file attachment',
  placeholder: 'Click to upload the image',
  validate: {
    ext: ['jpg', 'jpeg', 'png'],
  },
});

const getDatetimeMeta = () => ({
  type: 'DATETIME',
  key: 'datetimeField',
  label: 'Test date selection',
});

const getColorMeta = () => ({
  type: 'COLOR',
  key: 'colorField',
  label: 'Test color selection',
});

const getHtmlMeta = () => ({
  type: 'HTML',
  key: 'htmlField',
  label: 'Test html input',
});

// ----------------------------------------------------
// Activity type definition
// ----------------------------------------------------

const ACTIVITY_TYPE = {
  // Outline
  MODULE: 'MODULE',
  LESSON: 'LESSON',
  PAGE: 'PAGE',
  KNOWLEDGE_CHECK: 'KNOWLEDGE_CHECK',
  // Content containers
  INTRO: 'INTRO',
  CONTENT_SECTION: 'CONTENT_SECTION',
  ASSESSMENT_POOL: 'ASSESSMENT_POOL',
  EXAM: 'EXAM',
};

// ----------------------------------------------------
// Content containers
// ----------------------------------------------------

const getSectionContainer = () => ({
  type: ACTIVITY_TYPE.CONTENT_SECTION,
  label: 'Section',
  multiple: true,
  types: ['CE_HTML_DEFAULT', 'CE_IMAGE', 'CE_MULTIPLE_CHOICE'],
});

const getIntroContainer = () => ({
  type: ACTIVITY_TYPE.INTRO,
  label: 'Intro',
  layout: false,
  types: ['CE_HTML_DEFAULT', 'CE_IMAGE', 'CE_MULTIPLE_CHOICE'],
});

const getExamContainer = () => ({
  type: ACTIVITY_TYPE.EXAM,
  label: 'Exam',
  displayHeading: true,
  multiple: true,
  required: false,
  publishedAs: 'exam',
});

const getAssessmentPoolContainer = () => ({
  type: ACTIVITY_TYPE.ASSESSMENT_POOL,
  label: 'Assessments',
  publishedAs: 'assessments',
});

// ----------------------------------------------------
// Activity outline configuration
// ----------------------------------------------------

const getModuleActivityConfig = () => ({
  type: ACTIVITY_TYPE.MODULE,
  label: 'Module',
  rootLevel: true,
  isTrackedInWorkflow: true,
  color: '#536DFE',
  meta: [
    getInputMeta(),
    getTextareaMeta(),
    getSelectMeta(),
    getMultiselectMeta(),
    getSwitchMeta(),
    getCheckboxMeta(),
    getFileMeta(),
    getDatetimeMeta(),
    getHtmlMeta(),
    getColorMeta(),
  ],
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
  contentContainers: [ACTIVITY_TYPE.INTRO],
  subLevels: [
    ACTIVITY_TYPE.MODULE,
    ACTIVITY_TYPE.LESSON,
    ACTIVITY_TYPE.KNOWLEDGE_CHECK,
    ACTIVITY_TYPE.PAGE,
  ],
});

const getLessonActivityConfig = () => ({
  type: ACTIVITY_TYPE.LESSON,
  label: 'Lesson',
  color: '#FFA000',
  isTrackedInWorkflow: true,
  contentContainers: [
    ACTIVITY_TYPE.INTRO,
    ACTIVITY_TYPE.CONTENT_SECTION,
    ACTIVITY_TYPE.ASSESSMENT_POOL,
  ],
});

const getPageActivityConfig = () => ({
  type: ACTIVITY_TYPE.PAGE,
  label: 'Page',
  rootLevel: true,
  color: '#00BFA5',
  isTrackedInWorkflow: true,
  contentContainers: [ACTIVITY_TYPE.CONTENT_SECTION],
});

const getKnowledgeCheckActivityConfig = () => ({
  type: ACTIVITY_TYPE.KNOWLEDGE_CHECK,
  label: 'Knowledge check',
  isTrackedInWorkflow: true,
  color: '#E91E63',
  contentContainers: [ACTIVITY_TYPE.EXAM],
});

// ----------------------------------------------------
// Schema definition
// ----------------------------------------------------

export const SCHEMA = {
  id: 'TEST_SCHEMA',
  workflowId: DEFAULT_WORKFLOW.id,
  name: 'Test course structure',
  structure: [
    getModuleActivityConfig(),
    getLessonActivityConfig(),
    getKnowledgeCheckActivityConfig(),
    getPageActivityConfig(),
  ],
  contentContainers: [
    getSectionContainer(),
    getIntroContainer(),
    getExamContainer(),
    getAssessmentPoolContainer(),
  ],
  meta: [
    getInputMeta(),
    getTextareaMeta(),
    getSelectMeta(),
    getMultiselectMeta(),
    getSwitchMeta(),
    getCheckboxMeta(),
    getFileMeta(),
    getDatetimeMeta(),
    getHtmlMeta(),
    getColorMeta(),
  ],
  elementMeta: [
    {
      type: 'CE_IMAGE',
      inputs: [
        getInputMeta(),
        getTextareaMeta(),
        getSelectMeta(),
        getMultiselectMeta(),
        getSwitchMeta(),
        getCheckboxMeta(),
        getFileMeta(),
        getDatetimeMeta(),
        getHtmlMeta(),
        getColorMeta(),
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
