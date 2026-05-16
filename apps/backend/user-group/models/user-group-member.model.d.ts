import type { Model, ModelStatic } from 'sequelize';
import type { UserGroupMember as UserGroupMemberAttrs }
  from '@tailor-cms/interfaces/user-group';

// Sequelize instance type for a UserGroupMember join row. Composes the
// canonical attributes (from @tailor-cms/interfaces) with the Sequelize
// Model API.
export type UserGroupMember = UserGroupMemberAttrs &
  Model<UserGroupMemberAttrs>;

declare const UserGroupMember: ModelStatic<UserGroupMember>;
export default UserGroupMember;
