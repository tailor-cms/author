'use strict';

exports.up = ({ sequelize }) => sequelize.query(`
  UPDATE content_element
  SET refs = jsonb_set(
    refs - 'objectiveId',
    '{objective}',
    jsonb_build_object('id', refs->'objectiveId', 'type', 'ACTIVITY')
  )
  WHERE refs ? 'objectiveId';
`);

exports.down = ({ sequelize }) => sequelize.query(`
  UPDATE content_element
  SET refs = jsonb_set(
    refs - 'objective',
    '{objectiveId}',
    refs->'objective'->'id'
  )
  WHERE refs ? 'objective';
`);
