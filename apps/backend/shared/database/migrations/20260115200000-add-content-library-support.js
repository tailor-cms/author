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
 *   (kept for provenance even when unlinked)
 * - source_modified_at: Timestamp for update detection
 */
const TABLES = [
  { name: 'activity', indexPrefix: 'acty' },
  { name: 'content_element', indexPrefix: 'ce' },
];

exports.up = async (qi, { BOOLEAN, INTEGER, DATE }) => {
  // Drop unused legacy column
  await qi.removeColumn('content_element', 'linked');
  for (const { name: table, indexPrefix } of TABLES) {
    await qi.addColumn(table, 'is_linked_copy', {
      type: BOOLEAN, defaultValue: false, allowNull: false,
    });
    await qi.addColumn(table, 'source_id', {
      type: INTEGER,
      references: { model: table, key: 'id' },
      allowNull: true,
      onDelete: 'SET NULL',
    });
    await qi.addColumn(table, 'source_modified_at', {
      type: DATE, allowNull: true,
    });
    const partial = { where: { is_linked_copy: true } };
    await qi.addIndex(table, ['source_id'], {
      name: `idx_${indexPrefix}_source_id`, ...partial,
    });
    await qi.addIndex(table, ['is_linked_copy'], {
      name: `idx_${indexPrefix}_is_linked_copy`, ...partial,
    });
  }
};

exports.down = async (qi, { BOOLEAN }) => {
  for (const { name: table, indexPrefix } of TABLES) {
    await qi.removeIndex(table, `idx_${indexPrefix}_source_id`);
    await qi.removeIndex(table, `idx_${indexPrefix}_is_linked_copy`);
    await qi.removeColumn(table, 'is_linked_copy');
    await qi.removeColumn(table, 'source_id');
    await qi.removeColumn(table, 'source_modified_at');
  }
  // Restore legacy column
  await qi.addColumn('content_element', 'linked', {
    type: BOOLEAN, defaultValue: false, allowNull: false,
  });
};
