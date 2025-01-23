import 'dotenv/config';
import { Op } from 'sequelize';
import db from '#shared/database/index.js';

const { ContentElement, sequelize } = db;

migrateContentElements()
  .then(() => {
    console.info('Removed CE_ prefix from all content elements.');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });

async function migrateContentElements() {
  const transaction = await sequelize.transaction();
  await ContentElement.update(
    { type: sequelize.literal(`REPLACE(type, 'CE_', '')`) },
    { where: { type: { [Op.like]: 'CE_%' } } },
    { transaction });
  await ContentElement.update(
    { data: embedElementsQuery },
    { where: { 'data.embeds': { [Op.ne]: null } } },
    { transaction },
  );
  await ContentElement.update(
    { data: questionElementsQuery },
    { where: { 'data.question': { [Op.ne]: null } } },
    { transaction },
  );
  return transaction.commit();
}

const embedElementsQuery = sequelize.literal(`
  jsonb_set(
    data,
    '{embeds}',
    (
      SELECT jsonb_object_agg(
        key,
        CASE
          WHEN value->>'type' LIKE 'CE_%'
          THEN jsonb_set(
            value,
            '{type}',
            to_jsonb(REPLACE(value->>'type', 'CE_', ''))
          )
          ELSE value
        END
      )
      FROM jsonb_each(data->'embeds')
    )
  )
`);

const questionElementsQuery = sequelize.literal(`
  jsonb_set(
    data,
    '{embeds}',
    (
      SELECT jsonb_agg(
        CASE
          WHEN value->>'type' LIKE 'CE_%'
          THEN jsonb_set(
            value,
            '{type}',
            to_jsonb(REPLACE(value->>'type', 'CE_', ''))
          )
          ELSE value
        END
      )
      FROM jsonb_array_elements(data->'question')
    )
  )
`);
