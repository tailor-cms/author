import {
  canCreateRepository,
  canCreateRepositoryInGroup,
  hasRepositoryAdminAccess as _hasRepositoryAdminAccess,
} from '@tailor-cms/utils';
import { createError } from '#shared/error/helpers.js';
import { StatusCodes } from 'http-status-codes';
import first from 'lodash/first.js';

const forbid = () =>
  createError(StatusCodes.FORBIDDEN, 'Access restricted');

/**
 * Builds the acting user's access-policy context
 * (RepositoryAccessContext).
 */
const resolveRepositoryAccess = async (repository, user) => {
  const repositoryUser = first(
    await repository.getRepositoryUsers({
      where: { userId: user.id, hasAccess: true },
    }),
  );
  const repositoryGroupIds = (repository.userGroups ?? []).map((it) => it.id);
  const groupRoles = (user.userGroupMembers ?? [])
    .filter((it) => repositoryGroupIds.includes(it.groupId))
    .map((it) => it.role);
  return {
    userRole: user.role,
    repositoryRole: repositoryUser?.role,
    groupRoles,
  };
};

class AccessService {
  static instance;

  constructor() {
    if (!AccessService.instance) {
      AccessService.instance = this;
    }
    return AccessService.instance;
  }

  async hasRepositoryAccess(req, _res, next) {
    const { repository, user } = req;
    const hasAccess = await repository.hasAccess(user);
    return hasAccess ? next() : forbid();
  }

  async hasRepositoryAdminAccess(req, _res, next) {
    const { repository, user } = req;
    // System admins skip the membership lookup
    if (user.isAdmin()) return next();
    const access = await resolveRepositoryAccess(repository, user);
    return _hasRepositoryAdminAccess(access) ? next() : forbid();
  }

  async hasCreateRepositoryAccess(req, _res, next) {
    const { body = {}, user } = req;
    const { userGroupIds } = body;
    if (user.isAdmin()) return next();
    // Creating outside a group is gated by the system role alone
    if (!userGroupIds?.length) {
      return canCreateRepository({ userRole: user.role }) ? next() : forbid();
    }
    // Group-targeted creation requires a create-capable role in every
    // target group
    const hasCreateGrant = userGroupIds.every((id) =>
      user.userGroupMembers?.find(
        (it) => it.groupId === id && canCreateRepositoryInGroup(it.role),
      ),
    );
    return hasCreateGrant ? next() : forbid();
  }
}

const accessService = new AccessService();
export default accessService;
