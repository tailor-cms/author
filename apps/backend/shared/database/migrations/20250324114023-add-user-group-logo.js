'use strict';

const TABLE_NAME = 'user_group';
const COLUMN_NAME = 'logo_url';

exports.up = (qi, { TEXT }) =>
  qi.addColumn(TABLE_NAME, COLUMN_NAME, { type: TEXT });

exports.down = (qi) => qi.removeColumn(TABLE_NAME, COLUMN_NAME);
