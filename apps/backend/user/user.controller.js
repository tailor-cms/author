import isArray from 'lodash/isArray.js';
import map from 'lodash/map.js';
import { Op } from 'sequelize';
import { StatusCodes } from 'http-status-codes';
import { createError, validationError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';

const { User, UserGroup } = db;

const createFilter = (q) =>
  map(['email', 'firstName', 'lastName'], (it) => ({
    [it]: { [Op.iLike]: `%${q}%` },
  }));

async function list(
  { query: { email, role, filter, archived }, options },
  res,
) {
  const where = { [Op.and]: [] };
  if (filter) where[Op.or] = createFilter(filter);
  if (email) where[Op.and].push({ email });
  if (role) where[Op.and].push({ role });
  const { rows, count: total } = await User.findAndCountAll({
    where,
    include: [{ model: UserGroup, as: 'userGroups' }],
    ...options,
    paranoid: !archived,
  });
  return res.json({
    data: {
      items: map(rows, (it) => ({ ...it.profile, userGroups: it.userGroups })),
      total,
    },
  });
}

async function upsert(req, res) {
  const { uid, email, firstName, lastName, role, userGroupIds } = req.body;
  const payload = { uid, email, firstName, lastName, role };
  const user = await User.inviteOrUpdate(payload);
  if (isArray(userGroupIds)) {
    const userGroups = userGroupIds?.length
      ? await UserGroup.findAll({ where: { id: userGroupIds } })
      : [];
    await user.setUserGroups(userGroups);
  }
  return res.json({ data: user });
}

function remove({ params: { id } }, res) {
  return User.destroy({ where: { id } }).then(() =>
    res.sendStatus(StatusCodes.NO_CONTENT),
  );
}

function forgotPassword({ body }, res) {
  const { email } = body;
  return User.unscoped()
    .findOne({ where: { email } })
    .then(
      (user) => user || createError(StatusCodes.NOT_FOUND, 'User not found'),
    )
    .then((user) => user.sendResetToken())
    .then(() => res.end());
}

function resetPassword({ body, user }, res) {
  const { password } = body;
  return user
    .update({ password })
    .then(() => res.sendStatus(StatusCodes.NO_CONTENT));
}

function getProfile({ user, authData }, res) {
  return res.json({ user: user.profile, authData });
}

function updateProfile({ user, body }, res) {
  const { email, firstName, lastName, imgUrl } = body;
  return user
    .update({ email, firstName, lastName, imgUrl })
    .then(({ profile }) => res.json({ user: profile }))
    .catch(() => validationError(StatusCodes.CONFLICT));
}

function changePassword({ user, body }, res) {
  const { currentPassword, newPassword } = body;
  if (currentPassword === newPassword)
    return res.sendStatus(StatusCodes.BAD_REQUEST);
  return user
    .authenticate(currentPassword)
    .then((user) => user || createError(StatusCodes.BAD_REQUEST))
    .then((user) => user.update({ password: newPassword }))
    .then(() => res.sendStatus(StatusCodes.NO_CONTENT));
}

function reinvite({ params }, res) {
  return User.unscoped()
    .findByPk(params.id)
    .then(
      (user) =>
        user || createError(StatusCodes.NOT_FOUND, 'User does not exist!'),
    )
    .then((user) => User.sendInvitation(user))
    .then(() => res.status(StatusCodes.ACCEPTED).end());
}

export default {
  list,
  upsert,
  remove,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  reinvite,
};
