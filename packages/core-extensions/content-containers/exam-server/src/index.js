import filter from 'lodash/filter.js';
import pick from 'lodash/pick.js';
import Promise from 'bluebird';

const ATTRS = [
  'id', 'uid', 'type', 'position', 'parentId', 'createdAt', 'updatedAt',
];

// TODO: Temp solution, should be provided to functions via API once all the
// packages are migrated

const questions = [
  'MULTIPLE_CHOICE',
  'SINGLE_CHOICE',
  'MATCHING_QUESTION',
  'TEXT_RESPONSE',
  'TRUE_FALSE',
  'NUMERICAL_RESPONSE',
  'FILL_BLANK',
  'PAGE_BREAK',
  'DRAG_DROP',
];
const isQuestion = (type) => questions.includes(type);

async function fetchGroups(exam, { include }) {
  const groups = await exam.getChildren({ include });
  return {
    ...pick(exam, ATTRS),
    groups: groups.map((group) => ({
      ...pick(group, ['id', 'uid', 'type', 'position', 'data', 'createdAt']),
      intro: filter(group.ContentElements, (it) => !isQuestion(it.type)),
      assessments: filter(group.ContentElements, (it) => isQuestion(it.type)),
    })),
  };
}

function fetch(parent, type, childOptions) {
  const opts = { where: { type } };
  return parent.getChildren(opts).map((exam) => fetchGroups(exam, childOptions));
}

async function resolve(exam, resolveStatics) {
  exam.groups = await Promise.map(exam.groups, async (group) => {
    group.intro = await Promise.map(group.intro, resolveStatics);
    group.assessments = await Promise.map(group.assessments, resolveStatics);
    return group;
  });
  return exam;
}

export default {
  templateId: 'EXAM',
  version: '1.0',
  fetch,
  resolve,
  publishedAs: 'exam',
};
