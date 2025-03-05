import first from 'lodash/first.js';
import intersection from 'lodash/intersection.js';
import { StatusCodes } from 'http-status-codes';
import { UserRole } from '@tailor-cms/common';

import { createError } from '#shared/error/helpers.js';

class AccessService {
  static instance;

  constructor() {
    if (!AccessService.instance) {
      AccessService.instance = this;
    }
    return AccessService.instance;
  }

  async hasRepositoryAccess(repository, user) {
    // If user is a system admin, allow all
    if (user.isAdmin()) return true;
    // Get user relationship with the repository, if exists allow access
    const userRelationship = first(
      await repository.getRepositoryUsers({
        where: { userId: user.id, hasAccess: true },
      }),
    );
    if (userRelationship) return true;
    // Check if user is a member of any user group that has access to the repository
    const repositoryGroupIds = repository.userGroups.map((it) => it.id);
    const userGroupIds = user.userGroups.map((it) => it.id);
    if (intersection(repositoryGroupIds, userGroupIds).length) return true;
    // If none of the above conditions are met, deny access
    return false;
  }

  async hasRepositoryAccessMw(req, _res, next) {
    const { repository, user } = req;
    const hasAccess = await hasRepositoryAccess(repository, user);
    return hasAccess
      ? next()
      : createError(StatusCodes.UNAUTHORIZED, 'Access restricted');
  }

  async hasRepositoryAdminAccessMw(req, _res, next) {
    const { repository, user } = req;
    // If user is a system admin, allow all
    if (user.isAdmin()) return next();
    // Check if user is associated with the repository as an admin
    const userRelationship = first(
      await repository.getRepositoryUsers({
        where: { userId: user.id, role: UserRole.ADMIN, hasAccess: true },
      }),
    );
    if (userRelationship) return next();
    // Check if user is a member of repository associated user group and has
    // admin privileges
    const repositoryGroupIds = repository.userGroups.map((it) => it.id);
    const userGroupIds = user.userGroupMembers
      ?.filter((it) => it.role === UserRole.ADMIN)
      .map((it) => it.groupId);
    if (intersection(repositoryGroupIds, userGroupIds).length) return next();
    // If none of the above conditions are met, deny access
    return createError(StatusCodes.UNAUTHORIZED, 'Access restricted');
  }

  async hasCreateRepositoryAccessMw(req, _res, next) {
    const { body, user } = req;
    const { userGroupIds } = body;
    // If user is system admin, allow
    if (user.isAdmin()) return next();
    // If user is creating a repository for themselves, allow
    if (user.role === UserRole.USER && !userGroupIds?.length) return next();
    // If repository is created for a user group
    if (userGroupIds?.length) {
      const hasCreateGrant = userGroupIds.every((id) =>
        user.userGroupMembers?.find(
          (it) =>
            it.groupId === id &&
            [UserRole.ADMIN, UserRole.USER].includes(it.role),
        ),
      );
      if (hasCreateGrant) return next();
    }
    // If none of the above conditions are met, deny access
    return createError(StatusCodes.UNAUTHORIZED, 'Access restricted');
  }
}

export const hasRepositoryAccess = async (repository, user) => {
  // If user is a system admin, allow all
  if (user.isAdmin()) return true;
  // Get user relationship with the repository, if exists allow access
  const userRelationship = first(
    await repository.getRepositoryUsers({
      where: { userId: user.id, hasAccess: true },
    }),
  );
  if (userRelationship) return true;
  // Check if user is a member of any user group that has access to the repository
  const repositoryGroupIds = repository.userGroups.map((it) => it.id);
  const userGroupIds = user.userGroups.map((it) => it.id);
  if (intersection(repositoryGroupIds, userGroupIds).length) return true;
  // If none of the above conditions are met, deny access
  return false;
};

const accessService = new AccessService();
export default accessService;
