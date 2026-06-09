import { map } from 'lodash-es';
import { titleCase } from '@tailor-cms/utils';
import { UserRole } from '@tailor-cms/interfaces/role';

export interface GroupRole {
  title: string;
  value: string;
  description: string;
  icon: string;
}

const ROLE_META: Record<string, { description: string; icon: string }> = {
  [UserRole.ADMIN]: {
    description: `Manages the group's members and their roles.`,
    icon: 'mdi-account-cog',
  },
  [UserRole.USER]: {
    description: `Can create repositories and edit the group's shared ones.`,
    icon: 'mdi-account-edit',
  },
  [UserRole.COLLABORATOR]: {
    description: `Can edit the group's shared repositories, but can't create
      new ones.`,
    icon: 'mdi-account',
  },
};

export const GROUP_ROLES: GroupRole[] = map(
  [UserRole.ADMIN, UserRole.USER, UserRole.COLLABORATOR],
  (value) => ({
    title: titleCase(value),
    value,
    description: ROLE_META[value]!.description,
    icon: ROLE_META[value]!.icon,
  }),
);
