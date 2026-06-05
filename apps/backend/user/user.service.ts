// Business logic for the User slice.
//
// All DB orchestration, mail side effects (invitations, password resets)
// and cross-model coordination live here so the service surface is
// testable in isolation from Express.
import type {
  ListFilter,
  ListResult,
  ProfileUpdateInput,
  UpsertInput,
} from './schemas/index.ts';
import type { User, UserProfile } from './models/user.model.js';
import { assertStrongPassword } from './lib/password-strength.ts';
import { Op } from 'sequelize';
import type { PaginationOptions } from '#shared/request/action.ts';
import { UserRole } from '@tailor-cms/interfaces/role';
import db from '#shared/database/index.js';
import map from 'lodash/map.js';

const { User: UserModel, UserGroup } = db;

const SEARCH_FIELDS = ['email', 'firstName', 'lastName'] as const;

const buildFilter = (q: string) =>
  map(SEARCH_FIELDS, (field) => ({ [field]: { [Op.iLike]: `%${q}%` } }));

// Lists users with optional iLike search across email/firstName/lastName,
// exact email + role filters, and an `archived` toggle that also returns
// soft-deleted rows.
export async function list(
  opts: PaginationOptions,
  query: ListFilter,
): Promise<ListResult> {
  const where: any = { [Op.and]: [] };
  if (query.filter) where[Op.or] = buildFilter(query.filter);
  if (query.email) where[Op.and].push({ email: query.email });
  if (query.role) where[Op.and].push({ role: query.role });
  const { rows, count } = await UserModel.findAndCountAll({
    where,
    include: [{ model: UserGroup, as: 'userGroups' }],
    ...opts,
    paranoid: !query.archived,
    distinct: true,
  });
  const items = rows.map((it: any) => ({
    ...it.profile,
    userGroups: it.userGroups,
  }));
  return { total: count, items };
}

// Invites a brand-new user (sends invitation mail unless `skipInvite`)
// or updates the existing one matched by email. Replaces the user's
// user-group memberships when `userGroupIds` is supplied (omit to leave
// memberships untouched).
export async function upsert(payload: UpsertInput): Promise<UserProfile> {
  const { skipInvite, userGroupIds, ...attrs } = payload;
  const user = await UserModel.inviteOrUpdate(attrs, { skipInvite });
  if (Array.isArray(userGroupIds)) {
    const userGroups = userGroupIds.length
      ? await UserGroup.findAll({ where: { id: userGroupIds } })
      : [];
    await user.setUserGroups(userGroups);
  }
  return user.profile;
}

// Domain failure: refusing to delete the last remaining system admin
// would strand every admin-gated operation. Caught by the action layer
// and mapped to 409.
export class LastSystemAdminError extends Error {
  constructor(message = 'Cannot remove the last system admin') {
    super(message);
    this.name = 'LastSystemAdminError';
  }
}

// Soft-deletes the user (paranoid). Idempotent: removing an id that
// doesn't exist is a no-op. Throws `LastSystemAdminError` when the
// target is the last remaining system admin.
export async function remove(id: number): Promise<void> {
  const target = await UserModel.findByPk(id);
  if (!target) return;
  if (target.role === UserRole.ADMIN) {
    const remainingAdmins = await UserModel.count({
      where: { role: UserRole.ADMIN, id: { [Op.ne]: id } },
    });
    if (remainingAdmins === 0) throw new LastSystemAdminError();
  }
  await UserModel.destroy({ where: { id } });
}

// Looks up the user by email (paranoid:false so soft-deleted rows
// reset successfully) and triggers the reset-token mail flow.
export async function startPasswordReset(email: string): Promise<User | null> {
  const user = await UserModel.unscoped().findOne({ where: { email } });
  if (!user) return null;
  await user.sendResetToken();
  return user;
}

// Replaces the password on the supplied (already-token-authenticated)
// user. Hashing is handled by the User model's beforeUpdate hook.
// Throws `WeakPasswordError` when the new password fails the shared
// strength gate; the action layer maps it to 400 with feedback.
export async function resetPassword(
  user: User,
  password: string,
): Promise<void> {
  await assertStrongPassword(password, user);
  await user.update({ password });
}

// Builds the wire-shape returned by GET /users/me (and POST /users/login
// on success): the user's public profile, their accessible user groups,
// and the auth strategy / cookie data the client needs to keep its session
// store coherent.
export async function profile(user: User, authData: unknown) {
  const userGroups = await user.getAccessibleUserGroups();
  return { authData, user: user.profile, userGroups };
}

// Updates whitelist of editable profile fields. Returns the user's
// fresh `profile` virtual.
export async function updateProfile(
  user: User,
  patch: ProfileUpdateInput,
): Promise<UserProfile> {
  const updated = await user.update(patch);
  return updated.profile;
}

// Verifies the supplied current password and replaces it with the new
// one. Returns true on success, false if `currentPassword` did not
// authenticate. Throws `WeakPasswordError` when the new password fails
// the shared strength gate; the action layer maps it to 400 with
// feedback.
export async function changePassword(
  user: User,
  currentPassword: string,
  newPassword: string,
): Promise<boolean> {
  const authed = await user.authenticate(currentPassword);
  if (!authed) return false;
  await assertStrongPassword(newPassword, authed);
  await authed.update({ password: newPassword });
  return true;
}

// Resends the invitation mail for an existing user. Uses `unscoped()`
// so soft-deleted users can be reinvited (admin reactivation flow).
// Returns null when the id is unknown (caller maps to 404).
export async function reinvite(id: number): Promise<User | null> {
  const user = await UserModel.unscoped().findByPk(id);
  if (!user) return null;
  UserModel.sendInvitation(user);
  return user;
}
