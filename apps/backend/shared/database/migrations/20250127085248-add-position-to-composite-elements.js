'use strict';

const cloneDeep = require('lodash/cloneDeep');
const head = require('lodash/head');
const mapValues = require('lodash/mapValues');
const omit = require('lodash/omit');
const some = require('lodash/some');
const Promise = require('bluebird');

exports.up = async ({ sequelize }) => {
  const transaction = await sequelize.transaction();
  const elements = await getContentElements(sequelize, transaction);
  await Promise.each(elements, (el) => {
    const hasPositions = some(el.data.items, 'position');
    if (hasPositions) return Promise.resolve();
    let position = 1;
    const data = cloneDeep(el.data);
    data.items = mapValues(el.data.items, (it) => {
      it.position = position++;
      return it;
    });
    return updateElement(sequelize, el.id, data, transaction);
  });
  await transaction.commit();
};

exports.down = async ({ sequelize }) => {
  const transaction = await sequelize.transaction();
  const elements = await getContentElements(sequelize, transaction);
  await Promise.each(elements, (el) => {
    const hasPositions = some(el.data.items, 'position');
    if (!hasPositions) return Promise.resolve();
    const data = cloneDeep(el.data);
    data.items = mapValues(el.data.items, (it) => omit(it, 'position'));
    return updateElement(sequelize, el.id, data, transaction);
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
      content_element.type IN ('ACCORDION', 'CAROUSEL') OR
      content_element.data->'items' IS NOT NULL
  `;
  const options = { transaction, raw: true };
  return head(await sequelize.query(sql, options));
}

const updateElement = async (sequelize, id, data, transaction) => {
  const sql = `UPDATE content_element SET data=? WHERE id =?`;
  const options = {
    transaction,
    replacements: [JSON.stringify(data), id],
  };
  return sequelize.query(sql, options);
};
