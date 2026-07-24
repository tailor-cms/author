import type { UserGroup } from '@tailor-cms/interfaces/user-group';

// UserGroup decorated with the aggregate counts the list endpoint
// returns via subquery (see api.userGroup.list).
export type UserGroupRow = UserGroup & {
  memberCount?: number;
  repositoryCount?: number;
};
