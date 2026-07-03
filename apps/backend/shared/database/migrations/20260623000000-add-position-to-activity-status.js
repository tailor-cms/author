'use strict';

const TABLE_NAME = 'activity_status';
const COLUMN_NAME = 'position';

exports.up = (qi, { FLOAT }) =>
  qi.addColumn(TABLE_NAME, COLUMN_NAME, { type: FLOAT });

exports.down = (qi) => qi.removeColumn(TABLE_NAME, COLUMN_NAME);
