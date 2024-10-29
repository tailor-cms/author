import cloneDeep from 'lodash/cloneDeep.js';
import isArray from 'lodash/isArray.js';
import isNumber from 'lodash/isNumber.js';

/**
 * Returns a reference object without the reference of the given type and id.
 * See relationship configuration in the schema for more information.
 * @param {object} refs - Reference object containing the references
 * @param {string} type - Type of the reference (relationship name)
 * @param {number} id - Id of the the related entity
 * @returns {object} - Object without the reference of the given type and id
 */
export function removeReference(refs, type, id) {
  const res = cloneDeep(refs);
  // If the reference type does not exist, return the refs object as is
  if (!res[type]) return res;
  // If reference is configured as array
  if (isArray(res[type])) {
    // Can be either an array of numbers or an array of objects containing an id
    const cond = (it) => (isNumber(it) ? it !== id : it.id !== id);
    res[type] = res[type].filter(cond);
  } else {
    // If reference is configured as object, remove the reference key
    delete res[type];
  }
  return res;
}
