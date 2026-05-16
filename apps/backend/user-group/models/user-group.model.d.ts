import type {
  BelongsToManyGetAssociationsMixin,
  Model,
  ModelStatic,
} from 'sequelize';
import type { UserGroup as UserGroupAttrs } from '@tailor-cms/interfaces/user-group';
import type { User } from '../../user/models/user.model.js';

interface UserGroupAssociations {
  getUsers: BelongsToManyGetAssociationsMixin<User>;
}

// Sequelize instance type for a UserGroup entity. Composes the canonical
// attributes (from @tailor-cms/interfaces) with the Sequelize Model API
// and the association mixins generated for belongsToMany relations.
export type UserGroup = UserGroupAttrs &
  Model<UserGroupAttrs> &
  UserGroupAssociations;

declare const UserGroup: ModelStatic<UserGroup>;
export default UserGroup;
