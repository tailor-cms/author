import { capitalize, words, toLower, snakeCase, toUpper } from 'lodash-es';

const minorWords = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'en', 'for', 'from', 'how', 'if',
  'in', 'neither', 'nor', 'of', 'on', 'only', 'onto', 'out', 'or', 'per', 'so',
  'than', 'that', 'the', 'to', 'until', 'up', 'upon', 'v', 'v.', 'versus',
  'vs', 'vs.', 'via', 'when', 'with', 'without', 'yet',
]);

export const lowerCase = (value: string) => words(value).map(toLower).join(' ');
export const constantCase = (value: string) => toUpper(snakeCase(value));
export const sentenceCase = (value: string) => capitalize(lowerCase(value));
export const titleCase = (value: string) => words(value).map((word, index, arr) => {
  const lower = toLower(word);
  const isMinorWord = minorWords.has(lower);
  const isFirstOrLast = index === 0 || index === arr.length - 1;
  return (isFirstOrLast || !isMinorWord) ? capitalize(lower) : lower;
}).join(' ');
