'use strict';

const TABLE_NAME = 'repository_user';
const COLUMN_NAME = 'has_access';

exports.up = (qi, { BOOLEAN }) =>
  qi.addColumn(TABLE_NAME, COLUMN_NAME, { type: BOOLEAN, defaultValue: true });

exports.down = (qi) => qi.removeColumn(TABLE_NAME, COLUMN_NAME);
