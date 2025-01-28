'use strict';

const cloneDeep = require('lodash/cloneDeep');
const head = require('lodash/head');
const mapValues = require('lodash/mapValues');
const omit = require('lodash/omit');
const some = require('lodash/some');
const Promise = require('bluebird');

exports.up = async ({ sequelize }) => {
  const elements = await getContentElements(sequelize);
  await Promise.each(elements, (el) => {
    const hasPositions = some(el.data.items, 'position');
    if (hasPositions) return Promise.resolve();
    let position = 1;
    const data = cloneDeep(el.data);
    data.items = mapValues(el.data.items, (it) => {
      it.position = position++;
      return it;
    });
    return updateElement(sequelize, el.id, data);
  });
};

exports.down = async ({ sequelize }) => {
  const elements = await getContentElements(sequelize);
  await Promise.each(elements, (el) => {
    const hasPositions = some(el.data.items, 'position');
    if (!hasPositions) return Promise.resolve();
    const data = cloneDeep(el.data);
    data.items = mapValues(el.data.items, (it) => omit(it, 'position'));
    return updateElement(sequelize, el.id, data);
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
      content_element.type IN ('ACCORDION', 'CAROUSEL') OR
      content_element.data->'items' IS NOT NULL
  `;
  return head(await sequelize.query(sql, { raw: true }));
}

const updateElement = async (sequelize, id, data) => {
  const sql = `UPDATE content_element SET data=? WHERE id =?`;
  const options = { replacements: [JSON.stringify(data), id] };
  return sequelize.query(sql, options);
};
