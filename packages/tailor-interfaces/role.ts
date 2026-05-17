// Originally lived in @tailor-cms/common/src/role.js (runtime-only); the
// runtime shape is preserved here so existing callers keep working, with
// the addition of TS types via `as const`.

// System-level user role assigned on the User entity.
export const UserRole = {
  // Default role
  USER: 'USER',
  ADMIN: 'ADMIN',
  COLLABORATOR: 'COLLABORATOR',
  INTEGRATION: 'INTEGRATION',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// Per-repository role assigned via a RepositoryUser join row.
// ADMIN can manage settings and users; AUTHOR can edit content.
export const RepositoryRole = {
  ADMIN: 'ADMIN',
  AUTHOR: 'AUTHOR',
} as const;
export type RepositoryRole =
  (typeof RepositoryRole)[keyof typeof RepositoryRole];

// Combined namespace mirroring @tailor-cms/common's legacy default export.
// Kept so callers can `import role from '@tailor-cms/interfaces/role'`
// and reach role.user.ADMIN / role.repository.AUTHOR.
export const role = {
  user: UserRole,
  repository: RepositoryRole,
};

// Legacy named aliases preserved for compat with `import { user, repository }`.
export const user = UserRole;
export const repository = RepositoryRole;

export default role;
