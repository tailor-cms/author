import cloneDeep from 'lodash/cloneDeep.js';
import isArray from 'lodash/isArray.js';
import isNumber from 'lodash/isNumber.js';
import uniq from 'lodash/uniq.js';
import Promise from 'bluebird';

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

/**
 * Reference can be a number, object containing an id, array of objects
 * containing an id or an array of numbers. This function normalizes the
 * reference to an array of objects containing entity id.
 * @param {*} ref
 * @returns {object[]}
 */
export function normalizeReferenceValue(ref) {
  if (isNumber(ref)) return [{ id: ref }];
  if (isArray(ref)) return ref.map((it) => (isNumber(it) ? { id: it } : it));
  return [ref];
}

/**
 * Normalizes the references object to an array of objects containing the id
 * of the related entity and the reference name.
 * @param {*} refs
 * @returns {object[]}
 */
export const normalizeReferences = (refs) => {
  const referenceNames = Object.keys(refs);
  return referenceNames.reduce((acc, referenceName) => {
    const reference = refs[referenceName];
    // If value is falsy, skip
    if (!reference) return acc;
    const val = normalizeReferenceValue(reference);
    acc.push(...val.map((it) => ({ ...it, referenceName })));
    return acc;
  }, []);
};

/**
 * Normalize references for a collection of entities.
 * @param {Activity[]|ContentElement[]} items
 * @returns {object[]} - object[] containing the src entity, target info and
 * the referenceName.
 */
export const normalizeCollectionReferences = (items) => {
  if (!items || !items.length) return [];
  return items.reduce((acc, src) => {
    const references = normalizeReferences(src.refs);
    return acc.concat(
      references.map(({ referenceName, ...target }) => ({
        src,
        target,
        referenceName,
      })),
    );
  }, []);
};

/**
 * @param {Activity|ContentElement} Entity
 * @param {Activity[]|ContentElement[]} items
 * @param {Sequelize.Transaction} transaction
 * @returns {Promise.<object[]>} - Array of src, target and referenceName
 * mappings
 */
export const detectMissingReferences = async (Entity, items, transaction) => {
  const references = normalizeCollectionReferences(items);
  const referencedEntities = await Entity.findAll({
    where: { id: uniq(references.map((it) => it.target.id)) },
    attributes: ['id'],
    transaction,
  });
  // Filter out references where the target entity does not exist in the db
  const notExists = (r) =>
    !referencedEntities.find((it) => it.id === r.target.id);
  return references.filter(notExists);
};

export const removeInvalidReferences = async (
  Entity,
  repositoryId,
  references,
) => {
  if (!references?.length) return;
  const items = await Entity.findAll({
    where: {
      repositoryId,
      id: references.map((it) => it.src.id),
    },
  });
  await Promise.each(items, async (entity) => {
    const refs = references.filter((it) => entity.id === it.src.id);
    refs.forEach((r) => entity.removeReference(r.referenceName, r.target.id));
    await entity.save();
  });
};
