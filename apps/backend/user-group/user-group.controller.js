import { Op } from 'sequelize';
import { StatusCodes } from 'http-status-codes';

import { createError } from '#app/shared/error/helpers.js';
import db from '#shared/database/index.js';

const { User, UserGroup, UserGroupMember } = db;

async function list({ user, query: { filter }, options }, res) {
  const where = {};
  if (filter) where.name = { [Op.iLike]: `%${filter}%` };
  const opts = { where, ...options };
  if (!user.isAdmin()) {
    opts.include = [
      { model: UserGroupMember, where: { userId: user.id }, required: true },
    ];
  }
  const { rows, count } = await UserGroup.findAndCountAll(opts);
  return res.json({ data: { items: rows, total: count } });
}

function get({ userGroup }, res) {
  return res.json({ data: userGroup });
}

async function create({ body: { name, logoUrl } }, res) {
  const group = await UserGroup.findOne({ where: { name } });
  if (group) return createError(StatusCodes.CONFLICT, 'Group already exists');
  return UserGroup.create({ name, logoUrl }).then((data) => res.json({ data }));
}

async function update({ userGroup, body }, res) {
  const exists =
    body.name && (await UserGroup.findOne({ where: { name: body.name } }));
  if (exists && exists.id !== userGroup.id)
    return createError(StatusCodes.CONFLICT, 'Group already exists');
  await userGroup.update(body);
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
  let user = await User.findOne({ where: { email } });
  if (!user) user = await User.inviteOrUpdate({ email });
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
