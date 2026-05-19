// Business logic for the UserGroup
// All DB orchestration lives here so the service surface is testable in
// isolation from Express.
import { Op, UniqueConstraintError } from 'sequelize';
import { createLogger } from '#logger';
import db from '#shared/database/index.js';
import pick from 'lodash/pick.js';
import type { User } from '../user/models/user.model.js';
import type {
  CreateBody,
  ListQuery,
  PatchBody,
  UpsertMembersBody,
} from './user-group.schema.ts';
import type { UserGroup } from './models/user-group.model.js';

const {
  RepositoryUserGroup,
  sequelize,
  User: UserModel,
  UserGroup: UserGroupModel,
  UserGroupMember,
} = db;

const logger = createLogger('user-group:svc');

// Thrown when a name collides with the unique constraint. Caught by the
// action layer and mapped to 409.
export class DuplicateNameError extends Error {
  constructor(message = 'Group already exists') {
    super(message);
    this.name = 'DuplicateNameError';
  }
}

// Thrown by `removeMember` when the target user id is unknown. Caught by
// the action layer and mapped to 404.
export class MemberUserNotFoundError extends Error {
  constructor(message = 'User not found') {
    super(message);
    this.name = 'MemberUserNotFoundError';
  }
}

const isUniqueNameError = (err: unknown) =>
  err instanceof UniqueConstraintError;

export interface ListResult {
  total: number;
  items: UserGroup[];
}

// Lists user groups, optionally narrowed by name iLike. Non-admins only
// see groups they are a member of (scoped via UserGroupMember include).
export async function list(
  user: User,
  opts: any,
  filters: ListQuery,
): Promise<ListResult> {
  const where: any = { ...opts.where };
  if (filters.filter) where.name = { [Op.iLike]: `%${filters.filter}%` };
  const queryOpts: any = { ...opts, where, distinct: true };
  if (!user.isAdmin()) {
    queryOpts.include = [
      { model: UserGroupMember, where: { userId: user.id }, required: true },
    ];
  }
  const { rows, count } = await UserGroupModel.findAndCountAll(queryOpts);
  return { total: count, items: rows as UserGroup[] };
}

// Creates a group. Relies on the unique constraint on `name` for
// duplicate detection (race-safe) - any UniqueConstraintError on the
// `name` column is rethrown as `DuplicateNameError`.
export async function create(payload: CreateBody): Promise<UserGroup> {
  logger.debug({ name: payload.name }, 'Creating user group');
  try {
    return await UserGroupModel.create(payload);
  } catch (err) {
    if (isUniqueNameError(err)) throw new DuplicateNameError();
    throw err;
  }
}

// Updates the group's mutable fields.
export async function update(
  group: UserGroup,
  payload: PatchBody,
): Promise<UserGroup> {
  const updates = pick(payload, ['name', 'logoUrl']);
  try {
    return await group.update(updates);
  } catch (err) {
    if (isUniqueNameError(err)) throw new DuplicateNameError();
    throw err;
  }
}

// Hard-deletes the group together with its member rows and repository
// associations.
export async function remove(groupId: number): Promise<void> {
  const transaction = await sequelize.transaction();
  try {
    await UserGroupMember.destroy({ where: { groupId }, transaction });
    await RepositoryUserGroup.destroy({
      where: { groupId },
      individualHooks: true,
      transaction,
    });
    await UserGroupModel.destroy({ where: { id: groupId }, transaction });
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// Returns the group's member users (raw model rows; the join row sits at
// `user.userGroupMember` on each item).
export async function listMembers(group: UserGroup) {
  return group.getUsers();
}

// Invites missing users by email and assigns each (or updates the role
// of an existing member) on the supplied group. Sequential by design so
// invitation mails aren't sent in a thundering herd.
export async function upsertMembers(
  group: UserGroup,
  payload: UpsertMembersBody,
): Promise<void> {
  const { emails, role, skipInvite = false } = payload;
  for (const email of emails) {
    let user = await UserModel.findOne({ where: { email } });
    if (!user) {
      user = await UserModel.inviteOrUpdate({ email }, { skipInvite });
    }
    const [member, created] = await UserGroupMember.findOrCreate({
      where: { userId: user.id, groupId: group.id },
      defaults: { userId: user.id, groupId: group.id, role },
    });
    if (!created && member.role !== role) {
      await member.update({ role });
    }
  }
}

// Removes a member's row from the group. `MemberUserNotFoundError` if
// the user id is unknown so the route layer can map to 404.
export async function removeMember(
  group: UserGroup,
  userId: number,
): Promise<void> {
  const user = await UserModel.findByPk(userId);
  if (!user) throw new MemberUserNotFoundError();
  await UserGroupMember.destroy({
    where: { userId, groupId: group.id },
    individualHooks: true,
  });
}
