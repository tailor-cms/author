import type { Model, ModelStatic } from 'sequelize';

import type { RepositoryUser as RepositoryUserAttrs }
  from '@tailor-cms/interfaces/repository';

// Sequelize instance type for a RepositoryUser join row. Composes the
// canonical attributes (from @tailor-cms/interfaces) with the Sequelize
// Model API. The model declares no custom instance/static methods, so
// no extra members are mixed in.
export type RepositoryUser = RepositoryUserAttrs &
  Model<RepositoryUserAttrs>;

declare const RepositoryUser: ModelStatic<RepositoryUser>;
export default RepositoryUser;
