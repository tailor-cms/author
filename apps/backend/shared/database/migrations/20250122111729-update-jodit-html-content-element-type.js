'use strict';

const head = require('lodash/head');
const mapValues = require('lodash/mapValues');
const Promise = require('bluebird');

exports.up = async (queryInterface) => {
  await updateContentElementType(queryInterface.sequelize, 'JODIT_HTML', 'HTML');
};

exports.down = async (queryInterface) => {
  await updateContentElementType(queryInterface.sequelize, 'HTML', 'JODIT_HTML');
};

const updateContentElementType = async (sequelize, oldType, newType) => {
  const transaction = await sequelize.transaction();
  const elements = await getContentElements(sequelize, transaction);
  await Promise.each(elements, (el) => {
    const updatedData = processElement(el, oldType, newType);
    return updateElement(sequelize, updatedData, transaction);
  });
  await transaction.commit();
};

async function getContentElements(sequelize, transaction) {
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
  const options = { transaction, raw: true };
  return head(await sequelize.query(sql, options));
}

const processElement = (el, oldType, newType) => {
  const { embeds, question } = el.data;
  if (el.type === oldType) el.type = newType;
  if (embeds) {
    el.embeds = mapValues(embeds, (it) => processElement(it, oldType, newType));
  }
  if (question) {
    el.question = question.map((it) => processElement(it, oldType, newType));
  }
  return el;
};

const updateElement = async (sequelize, el, transaction) => {
  const sql = `UPDATE content_element SET type=?, data=? WHERE id =?`;
  const options = {
    transaction,
    replacements: [el.type, JSON.stringify(el.data), el.id],
  };
  return sequelize.query(sql, options);
};
