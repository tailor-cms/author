'use strict';

/**
 * Content Library Feature
 *
 * Adds library linking support to Activity and ContentElement tables.
 * Enables content reuse across repositories with source tracking.
 *
 * Fields added:
 * - is_linked_copy: Boolean flag indicating if item is an active linked copy
 * - source_id: FK to source activity/element ID
 *              (kept for provenance even when unlinked)
 * - source_modified_at: Timestamp for update detection
 */

const ACTIVITY_TABLE = 'activity';
const ELEMENT_TABLE = 'content_element';

exports.up = async (qi, Sequelize) => {
  const { BOOLEAN, INTEGER, DATE } = Sequelize;

  // Activity table
  await qi.addColumn(ACTIVITY_TABLE, 'is_linked_copy', {
    type: BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });
  await qi.addColumn(ACTIVITY_TABLE, 'source_id', {
    type: INTEGER,
    references: {
      model: ACTIVITY_TABLE,
      key: 'id',
    },
    allowNull: true,
    onDelete: 'SET NULL',
  });
  await qi.addColumn(ACTIVITY_TABLE, 'source_modified_at', {
    type: DATE,
    allowNull: true,
  });
  // Activity indexes
  await qi.addIndex(ACTIVITY_TABLE, ['source_id'], {
    name: 'idx_activity_source_id',
    where: { is_linked_copy: true },
  });
  await qi.addIndex(ACTIVITY_TABLE, ['is_linked_copy'], {
    name: 'idx_activity_is_linked_copy',
    where: { is_linked_copy: true },
  });

  // ContentElement table
  await qi.renameColumn(ELEMENT_TABLE, 'linked', 'is_linked_copy');
  await qi.addColumn(ELEMENT_TABLE, 'source_id', {
    type: INTEGER,
    references: {
      model: ELEMENT_TABLE,
      key: 'id',
    },
    allowNull: true,
    onDelete: 'SET NULL',
  });
  await qi.addColumn(ELEMENT_TABLE, 'source_modified_at', {
    type: DATE,
    allowNull: true,
  });
  await qi.addIndex(ELEMENT_TABLE, ['source_id'], {
    name: 'idx_element_source_id',
    where: { is_linked_copy: true },
  });
  await qi.addIndex(ELEMENT_TABLE, ['is_linked_copy'], {
    name: 'idx_element_is_linked_copy',
    where: { is_linked_copy: true },
  });
};

exports.down = async (qi) => {
  // Remove ContentElement indexes and columns
  await qi.removeIndex(ELEMENT_TABLE, 'idx_element_source_id');
  await qi.removeIndex(ELEMENT_TABLE, 'idx_element_is_linked_copy');
  await qi.renameColumn(ELEMENT_TABLE, 'is_linked_copy', 'linked');
  await qi.removeColumn(ELEMENT_TABLE, 'source_id');
  await qi.removeColumn(ELEMENT_TABLE, 'source_modified_at');
  // Remove Activity indexes and columns
  await qi.removeIndex(ACTIVITY_TABLE, 'idx_activity_source_id');
  await qi.removeIndex(ACTIVITY_TABLE, 'idx_activity_is_linked_copy');
  await qi.removeColumn(ACTIVITY_TABLE, 'is_linked_copy');
  await qi.removeColumn(ACTIVITY_TABLE, 'source_id');
  await qi.removeColumn(ACTIVITY_TABLE, 'source_modified_at');
};
