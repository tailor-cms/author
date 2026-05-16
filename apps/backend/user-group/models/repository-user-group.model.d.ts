import type { Model, ModelStatic } from 'sequelize';
import type {
  RepositoryUserGroup as RepositoryUserGroupAttrs,
} from '@tailor-cms/interfaces/repository';

// Sequelize instance type for the RepositoryUserGroup join row. Composes
// the canonical attributes (from @tailor-cms/interfaces) with the
// Sequelize Model API.
export type RepositoryUserGroup = RepositoryUserGroupAttrs &
  Model<RepositoryUserGroupAttrs>;

declare const RepositoryUserGroup: ModelStatic<RepositoryUserGroup>;
export default RepositoryUserGroup;
