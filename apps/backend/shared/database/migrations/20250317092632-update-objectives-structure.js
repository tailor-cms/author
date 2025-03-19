'use strict';

const head = require('lodash/head');

exports.up = async ({ sequelize }) => {
  const activityIds = await getTargetActivities(sequelize);
  if (!activityIds.length) return;
  sequelize.query(`
    UPDATE content_element
    SET refs = jsonb_set(
      refs - 'objectiveId',
      '{objective}',
      jsonb_build_object('id', refs->'objectiveId', 'entity', 'Activity')
    )
    WHERE refs ? 'objectiveId'
    AND activity_id IN (${activityIds.join(',')});
  `);
};

exports.down = ({ sequelize }) =>
  sequelize.query(`
  UPDATE content_element
  SET refs = jsonb_set(
    refs - 'objective',
    '{objectiveId}',
    refs->'objective'->'id'
  )
  WHERE refs ? 'objective';
`);

async function getTargetActivities(sequelize) {
  const sql = `
    SELECT
      id
    FROM
      activity
    WHERE
      type = 'ASSESSMENT_GROUP';
  `;
  return head(await sequelize.query(sql, { raw: true })).map((row) => row.id);
}
