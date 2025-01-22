'use strict';

const TABLE_NAME = 'content_element';

exports.up = async (queryInterface) => {
  await updateContentElementType(queryInterface, 'JODIT_HTML', 'HTML');
};

exports.down = async (queryInterface) => {
  await updateContentElementType(queryInterface, 'HTML', 'JODIT_HTML');
};

const updateContentElementType = async (qi, oldType, newType) => {
  await updateRootTypes(qi, oldType, newType);
  await updateEmbedsTypes(qi, oldType, newType);
  await updateQuestionTypes(qi, oldType, newType);
};

const updateRootTypes = (qi, oldType, newType) => qi.bulkUpdate(
  TABLE_NAME,
  { type: newType },
  { type: oldType },
);

const updateEmbedsTypes = (qi, oldType, newType) => qi.sequelize.query(`
  UPDATE ${TABLE_NAME}
  SET data = jsonb_set(
    data,
    '{embeds}',
    (
      SELECT jsonb_object_agg(
        key,
        CASE
          WHEN value->>'type' = '${oldType}'
          THEN jsonb_set(value, '{type}', '"${newType}"')
          ELSE value
        END
      )
      FROM jsonb_each(data->'embeds')
    )
  )
  WHERE data->'embeds' IS NOT NULL;
`);

const updateQuestionTypes = (qi, oldType, newType) => qi.sequelize.query(`
  UPDATE ${TABLE_NAME}
  SET data = jsonb_set(
    data,
    '{question}',
    (
      SELECT jsonb_agg(
        CASE
          WHEN value->>'type' = '${oldType}'
          THEN jsonb_set(value, '{type}', '"${newType}"')
          ELSE value
        END
      )
      FROM jsonb_array_elements(data->'question')
    )
  )
  WHERE data->'question' IS NOT NULL;
`);
