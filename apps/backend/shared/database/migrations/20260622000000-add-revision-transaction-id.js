'use strict';

// Groups the revisions of one logical operation (e.g. a restore cascade).
const TABLE_NAME = 'revision';
const COLUMN_NAME = 'transaction_id';

exports.up = (qi, { UUID }) =>
  qi.addColumn(TABLE_NAME, COLUMN_NAME, { type: UUID, allowNull: true });

exports.down = (qi) => qi.removeColumn(TABLE_NAME, COLUMN_NAME);
