import type { Model, ModelStatic } from 'sequelize';

import type { RepositoryUser as RepositoryUserAttributes }
  from '@tailor-cms/interfaces/repository';

export { RepositoryRole } from '@tailor-cms/interfaces/repository';
export type { RepositoryUserAttributes };

// Sequelize instance type for a RepositoryUser join row. Composes the
// canonical attributes (from @tailor-cms/interfaces) with the Sequelize
// Model API. The model declares no custom instance/static methods, so
// no extra members are mixed in.
export type RepositoryUser = RepositoryUserAttributes &
  Model<RepositoryUserAttributes>;

declare const RepositoryUser: ModelStatic<RepositoryUser>;
export default RepositoryUser;
