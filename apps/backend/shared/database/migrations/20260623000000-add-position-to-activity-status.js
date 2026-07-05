'use strict';

const TABLE_NAME = 'activity_status';
const COLUMN_NAME = 'position';

exports.up = async (qi, { FLOAT }) => {
  await qi.addColumn(TABLE_NAME, COLUMN_NAME, { type: FLOAT });
  await qi.sequelize.query(
    `UPDATE ${TABLE_NAME} SET ${COLUMN_NAME} = activity_id WHERE ${COLUMN_NAME} IS NULL`,
  );
};

exports.down = (qi) => qi.removeColumn(TABLE_NAME, COLUMN_NAME);
