export const questionType = new Map([
  ['NR', 'NUMERICAL_RESPONSE'],
  ['MQ', 'MATCHING_QUESTION'],
  ['DD', 'DRAG_DROP'],
  ['MC', 'MULTIPLE_CHOICE'],
  ['SC', 'SINGLE_CHOICE'],
  ['TF', 'TRUE_FALSE'],
  ['TR', 'TEXT_RESPONSE'],
  ['FB', 'FILL_BLANK'],
]);

const LEGACY_QUESTION_TYPES = ['ASSESSMENT', 'REFLECTION', 'QUESTION'];
export const isLegacyQuestion = (type: string) =>
  LEGACY_QUESTION_TYPES.includes(type);
