import type { Model, ModelStatic } from 'sequelize';
import type { Tag as TagAttrs } from '@tailor-cms/interfaces/repository';

// Sequelize instance type for a Tag entity. Composes the canonical
// attributes (from @tailor-cms/interfaces) with the Sequelize Model API.
export type Tag = TagAttrs & Model<TagAttrs>;

declare const Tag: ModelStatic<Tag>;
export default Tag;
