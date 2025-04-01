import pick from 'lodash/pick.js';
import Promise from 'bluebird';
import partition from 'lodash/partition.js';

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
  'DRAG_DROP',
];
const isQuestion = (type) => questions.includes(type);

async function fetchGroups(exam, { include }) {
  const groups = await exam.getChildren({ include });
  const [assessments, intro] = partition(groups, (it) => isQuestion(it.type));
  return {
    ...pick(exam, ATTRS),
    groups: groups.map((group) => ({
      ...pick(group, ['id', 'uid', 'type', 'position', 'data', 'createdAt']),
      intro,
      assessments: assessments.map(({ refs, ...element }) => {
        if (refs.objective) {
          refs.objectiveId = refs.objective.id || null;
          delete refs.objective;
        }
        return { ...element, refs };
      }),
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
