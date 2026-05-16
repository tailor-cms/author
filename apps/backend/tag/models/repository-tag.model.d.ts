import type { Model, ModelStatic } from 'sequelize';
import type {
  RepositoryTag as RepositoryTagAttrs,
} from '@tailor-cms/interfaces/repository';

// Sequelize instance type for the RepositoryTag join row. Composes the
// canonical attributes (from @tailor-cms/interfaces) with the Sequelize
// Model API. The model declares no custom instance/static methods, so no
// extra members are mixed in.
export type RepositoryTag = RepositoryTagAttrs & Model<RepositoryTagAttrs>;

declare const RepositoryTag: ModelStatic<RepositoryTag>;
export default RepositoryTag;
