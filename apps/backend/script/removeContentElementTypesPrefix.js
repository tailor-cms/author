import 'dotenv/config';
import { Op } from 'sequelize';
import mapValues from 'lodash/mapValues.js';
import db from '#shared/database/index.js';

const { ContentElement } = db;

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
  const where = {
    [Op.or]: [
      { type: 'JODIT_HTML' },
      { 'data.embeds': { [Op.ne]: null } },
      { 'data.question': { [Op.ne]: null } },
    ],
  };
  return ContentElement
    .findAll({ where })
    .each((el) => el.update(
      processElement(el.toJSON()),
    ));
}

const processElement = (el) => {
  const { embeds, question } = el.data;
  if (el.type.startsWith('CE_')) el.type = el.type.replace('CE_', '');
  if (embeds) el.embeds = mapValues(embeds, processElement);
  if (question) el.question = question.map(processElement);
  return el;
};
