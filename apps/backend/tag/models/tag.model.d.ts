import type { Model, ModelStatic } from 'sequelize';
import type { Tag as TagAttrs } from '@tailor-cms/interfaces/repository';
import type { User } from '../../user/models/user.model.js';

// Sequelize instance type for a Tag entity. Composes the canonical
// attributes (from @tailor-cms/interfaces) with the Sequelize Model API.
export type Tag = TagAttrs & Model<TagAttrs>;

interface TagModel extends ModelStatic<Tag> {
  // Returns the subset of tags attached to repositories visible to
  // `user`. Admins see every tag that has at least one repository link;
  // non-admins are restricted to tags reachable through their own
  // repository memberships (via the RepositoryTag + RepositoryUser join).
  getAssociated(user: User): Promise<Tag[]>;
}

declare const Tag: TagModel;
export default Tag;
