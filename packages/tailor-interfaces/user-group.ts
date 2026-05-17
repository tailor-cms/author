import type { UserRole } from './role';

// Workspace entity. Repositories are shared with groups, and every
// member of the group inherits access (see RepositoryUserGroup).
export interface UserGroup {
  id: number;
  name: string;
  logoUrl?: string;
}

// Join row connecting a User to a UserGroup with a role.
// The role uses the system-level `UserRole` enum (the model accepts
// ADMIN | COLLABORATOR | USER; INTEGRATION is excluded). Composite
// primary key on (userId, groupId); no timestamps.
export interface UserGroupMember {
  userId: number;
  groupId: number;
  role: UserRole;
}

// Convenience shape: a UserGroup decorated with the acting user's role
// in that group (joined through UserGroupMember). Returned by endpoints
// that present a user's groups.
export interface UserGroupWithRole extends UserGroup {
  role: UserRole;
}
