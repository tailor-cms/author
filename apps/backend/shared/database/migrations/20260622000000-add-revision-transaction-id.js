'use strict';

// Groups revisions produced by a single logical operation (e.g. a restore
// cascade) so the UI can collapse them into one entry. Null for standalone
// edits.
const TABLE_NAME = 'revision';
const COLUMN_NAME = 'transaction_id';

exports.up = (qi, { UUID }) =>
  qi.addColumn(TABLE_NAME, COLUMN_NAME, { type: UUID, allowNull: true });

exports.down = (qi) => qi.removeColumn(TABLE_NAME, COLUMN_NAME);
