import { map } from 'lodash-es';
import { role, type RepositoryRole } from '@tailor-cms/interfaces/role';
import { titleCase } from '@tailor-cms/utils';

export interface RepositoryRoleOption {
  title: string;
  value: RepositoryRole;
  description?: string;
  icon?: string;
}

const ROLE_DESCRIPTIONS: Partial<Record<RepositoryRole, string>> = {
  ADMIN: `Full access. Edit content, manage access, publish, clone, export,
    and delete the repository.`,
  AUTHOR: `Edit content and structure. Cannot publish, manage access, or
    delete the repository.`,
};

const ROLE_ICONS: Partial<Record<RepositoryRole, string>> = {
  ADMIN: 'mdi-account-cog',
  AUTHOR: 'mdi-text-box-edit',
};

export const useRepositoryRoles = () => computed<RepositoryRoleOption[]>(() =>
  map(role.repository, (value) => ({
    title: titleCase(value),
    value,
    description: ROLE_DESCRIPTIONS[value],
    icon: ROLE_ICONS[value],
  })));
