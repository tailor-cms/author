import 'dotenv/config';
import { Op } from 'sequelize';
import forEach from 'lodash/forEach.js';
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
      { type: { [Op.like]: 'CE_%' } },
      { 'data.embeds': { [Op.ne]: null } },
    ],
  };
  return ContentElement
    .findAll({ where })
    .each((el) => {
      const data = processElement(el.toJSON());
      return el.update(data);
    });
}

const processElement = (el) => {
  if (el.type.startsWith('CE_')) el.type = getNewType(el.type);
  if (el.data.embeds) forEach(el.data.embeds, processElement);
  return el;
};

const getNewType = (type) => {
  return type === 'CE_HTML_DEFAULT' ? 'TIPTAP_HTML' : type.replace('CE_', '');
};
