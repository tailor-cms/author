'use strict';

const cloneDeep = require('lodash/cloneDeep');
const forEach = require('lodash/forEach');
const head = require('lodash/head');
const Promise = require('bluebird');

exports.up = async (queryInterface) => {
  await updateContentElementType(queryInterface.sequelize, 'JODIT_HTML', 'HTML');
};

exports.down = async (queryInterface) => {
  await updateContentElementType(queryInterface.sequelize, 'HTML', 'JODIT_HTML');
};

const updateContentElementType = async (sequelize, oldType, newType) => {
  const elements = await getContentElements(sequelize);
  await Promise.each(elements, (el) => {
    const updatedData = processElement(cloneDeep(el), oldType, newType);
    return updateElement(sequelize, updatedData);
  });
};

async function getContentElements(sequelize) {
  const sql = `
    SELECT
      id,
      type,
      data
    FROM
      content_element
    WHERE
      content_element.type = 'CE_JODIT_HTML' OR
      content_element.data->'embeds' IS NOT NULL OR
      content_element.data->'question' IS NOT NULL
  `;
  return head(await sequelize.query(sql, { raw: true }));
}

const processElement = (el, oldType, newType) => {
  const { embeds, question } = el.data;
  if (el.type === oldType) el.type = newType;
  if (embeds) forEach(embeds, (it) => processElement(it, oldType, newType));
  if (question) forEach(question, (it) => processElement(it, oldType, newType));
  return el;
};

const updateElement = async (sequelize, el) => {
  const sql = `UPDATE content_element SET type=?, data=? WHERE id =?`;
  const options = { replacements: [el.type, JSON.stringify(el.data), el.id] };
  return sequelize.query(sql, options);
};
