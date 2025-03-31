'use strict';

const head = require('lodash/head');

const ACTIVITY_TYPE = 'ASSESSMENT_GROUP';

exports.up = async ({ sequelize }) => {
  const activityIds = await getActivityIdsByType(sequelize, ACTIVITY_TYPE);
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

exports.down = async ({ sequelize }) => {
  const activityIds = await getActivityIdsByType(sequelize, ACTIVITY_TYPE);
  if (!activityIds.length) return;
  sequelize.query(`
    UPDATE content_element
    SET refs = jsonb_set(
      refs - 'objective',
      '{objectiveId}',
      refs->'objective'->'id'
    )
    WHERE refs ? 'objective'
    AND activity_id IN (${activityIds.join(',')});
  `);
};

async function getActivityIdsByType(sequelize, type) {
  const sql = `
    SELECT
      id
    FROM
      activity
    WHERE
      type = '${type}';
  `;
  return head(await sequelize.query(sql, { raw: true })).map((row) => row.id);
}
