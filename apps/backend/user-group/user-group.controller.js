import { StatusCodes } from 'http-status-codes';
import map from 'lodash/map.js';
import { Op } from 'sequelize';

import { createError } from '#app/shared/error/helpers.js';
import db from '#shared/database/index.js';

const { User, UserGroup } = db;
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

async function get({ userGroup }, res) {
  return res.json({ data: userGroup });
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

async function getUsers({ userGroup }, res) {
  const users = await userGroup.getUsers();
  return res.json({ data: users });
}

async function upsertUser(req, res) {
  const { email, role } = req.body;
  const user = await User.inviteOrUpdate({ email });
  await req.userGroup.addUser(user, { through: { role } });
  return res.sendStatus(StatusCodes.NO_CONTENT);
}

async function removeUser({ params: { userId }, userGroup }, res) {
  const user = await User.findByPk(userId);
  if (!user) return createError(StatusCodes.NOT_FOUND, 'User not found');
  await userGroup.removeUser(userId);
  return res.sendStatus(StatusCodes.NO_CONTENT);
}

export default {
  list,
  get,
  create,
  update,
  remove,
  getUsers,
  upsertUser,
  removeUser,
};
