import { StatusCodes } from 'http-status-codes';
import map from 'lodash/map.js';
import { Op } from 'sequelize';
import db from '#shared/database/index.js';

const { UserGroup } = db;
const createFilter = (q) =>
  map(['name'], (it) => ({
    [it]: { [Op.iLike]: `%${q}%` },
  }));

async function list({ query: { filter, archived }, options }, res) {
  const where = { [Op.and]: [] };
  if (filter) where[Op.or] = createFilter(filter);
  const opts = { where, ...options, paranoid: !archived };
  const { rows, count } = await UserGroup.findAndCountAll(opts);
  return res.json({ data: { items: rows, total: count } });
}

function create({ body: { name } }, res) {
  return UserGroup.create({ name }).then((data) => res.json({ data }));
}

async function update({ userGroup, body: { name } }, res) {
  await userGroup.update({ name });
  return res.json({ data: userGroup });
}

async function remove({ params: { id } }, res) {
  await UserGroup.destroy({ where: { id } });
  return res.sendStatus(StatusCodes.NO_CONTENT);
}

export default {
  list,
  create,
  update,
  remove,
};
