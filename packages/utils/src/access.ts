import type {
  RepositoryAccessContext,
} from '@tailor-cms/interfaces/repository';
import type {
  UserGroupAccessContext,
} from '@tailor-cms/interfaces/user-group';
import { RepositoryRole, UserRole } from '@tailor-cms/interfaces/role';

export type { RepositoryAccessContext, UserGroupAccessContext };

type SystemAccess = Pick<RepositoryAccessContext, 'userRole'>;

const isSystemAdmin = ({ userRole }: SystemAccess) =>
  userRole === UserRole.ADMIN || userRole === UserRole.INTEGRATION;

/**
 * Admin standing on a repository: system admin, individual member with
 * the repository ADMIN role, or ADMIN of a user group the repository is
 * shared with.
 */
export const hasRepositoryAdminAccess = (
  access: RepositoryAccessContext,
): boolean =>
  isSystemAdmin(access) ||
  access.repositoryRole === RepositoryRole.ADMIN ||
  !!access.groupRoles?.includes(UserRole.ADMIN);

// One rule per action so a policy change is a one-line edit here rather
// than a hunt across apps. Every rule assumes the user can already view
// the repository (membership is checked separately).

// Repository settings are the admin surface.
export const canAccessRepositorySettings = hasRepositoryAdminAccess;
export const canManageRepositoryAccess = hasRepositoryAdminAccess;
export const canDeleteRepository = hasRepositoryAdminAccess;
export const canPublishRepository = hasRepositoryAdminAccess;
export const canCloneRepository = hasRepositoryAdminAccess;
export const canExportRepository = hasRepositoryAdminAccess;

/**
 * Creating a repository outside a user group requires at least the USER
 * system role.
 */
export const canCreateRepository = (access: SystemAccess): boolean =>
  isSystemAdmin(access) || access.userRole === UserRole.USER;

// Group roles allowed to create (or import) repositories in that group.
export const canCreateRepositoryInGroup = (groupRole: UserRole): boolean =>
  groupRole === UserRole.ADMIN || groupRole === UserRole.USER;

/**
 * Admin standing on a user group: system admin, or an ADMIN member of
 * the group itself.
 */
export const hasUserGroupAdminAccess = (
  access: UserGroupAccessContext,
): boolean => isSystemAdmin(access) || access.groupRole === UserRole.ADMIN;

// Member management is the group-admin surface.
export const canManageUserGroupMembers = hasUserGroupAdminAccess;

/**
 * Writing the group entity (create/rename/logo/delete) is a system-admin
 * surface, matching the admin group-management screen. Group role is
 * irrelevant, so this takes the role-only access shape.
 */
export const canWriteUserGroup = (access: SystemAccess): boolean =>
  isSystemAdmin(access);
export const canCreateUserGroup = canWriteUserGroup;
export const canModifyUserGroup = canWriteUserGroup;
