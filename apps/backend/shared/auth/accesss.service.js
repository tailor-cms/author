import first from 'lodash/first.js';
import intersection from 'lodash/intersection.js';
import { role } from '@tailor-cms/common';
import { StatusCodes } from 'http-status-codes';

import { createError } from '#shared/error/helpers.js';

const { user: UserRole } = role;

class AccessService {
  constructor() {}

  async hasRepositoryAccess(req, _res, next) {
    const { repository, user } = req;
    // If user is a system admin, allow all
    if (user.isAdmin()) return next();
    // Get user relationship with the repository, if exists allow access
    const userRelationship = first(
      await repository.getRepositoryUsers({
        where: { userId: user.id },
      }),
    );
    if (userRelationship && userRelationship.hasAccess) return next();
    // Check if user is a member of any user group that has access to the repository
    const repositoryGroupIds = repository.userGroups.map((it) => it.id);
    const userGroupIds = user.userGroups.map((it) => it.id);
    if (intersection(repositoryGroupIds, userGroupIds).length) return next();
    // If none of the above conditions are met, deny access
    return createError(StatusCodes.UNAUTHORIZED, 'Access restricted');
  }

  async hasRepositoryAdminAccess(req, _res, next) {
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

  async hasCreateRepositoryAccess(req, _res, next) {
    const { body, user } = req;
    const { userGroupIds } = body;
    // If user is system admin, allow
    if (user.isAdmin()) return next();
    // If user is creating a repository for themselves, allow
    if (user.role === UserRole.USER && !userGroupIds?.length) return next();
    // If repository is created for a user group
    if (userGroupIds.length) {
      const isGroupMember = userGroupIds.every((id) =>
        user.userGroupMembers?.find(
          (it) =>
            it.groupId === id &&
            [UserRole.ADMIN, UserRole.USER].includes(it.role),
        ),
      );
      if (isGroupMember) return next();
    }
    // If none of the above conditions are met, deny access
    return createError(StatusCodes.UNAUTHORIZED, 'Access restricted');
  }
}

export default new AccessService();
