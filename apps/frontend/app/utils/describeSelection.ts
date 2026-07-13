import { uniq } from 'lodash-es';
import pluralize from 'pluralize-esm';

/**
 * Grammar bits for messages about a selection of typed items ("The Module
 * has been copied", "2 Pages have been linked", "Delete 3 Courses?").
 * Selections spanning multiple types fall back to a generic "item".
 */
export const describeSelection = (labels: string[]) => {
  const count = labels.length;
  const types = uniq(labels);
  // Normalize to singular - collection entity labels are plural (e.g. "Tags")
  const label = types.length === 1 ? pluralize.singular(types[0]!) : 'item';
  return {
    count,
    label,
    countLabel: pluralize(label, count, true),
    noun: count === 1 ? `the ${label}` : `${count} ${pluralize(label)}`,
    verb: count === 1 ? 'has' : 'have',
  };
};
