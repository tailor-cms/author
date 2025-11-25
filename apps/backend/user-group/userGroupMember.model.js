import { Model } from 'sequelize';
import { UserRole } from '@tailor-cms/common';
import hooks from './userGroupMember.hooks.js';

class UserGroupMember extends Model {
  static fields({ ENUM, INTEGER }) {
    return {
      userId: {
        type: INTEGER,
        field: 'user_id',
        primaryKey: true,
        unique: 'user_group_member_pkey',
      },
      groupId: {
        type: INTEGER,
        field: 'group_id',
        primaryKey: true,
        unique: 'user_group_member_pkey',
      },
      role: {
        type: ENUM(UserRole.ADMIN, UserRole.COLLABORATOR, UserRole.USER),
        defaultValue: UserRole.USER,
      },
    };
  }

  static associate({ User, UserGroup }) {
    this.belongsTo(User, {
      foreignKey: { name: 'userId', field: 'user_id' },
    });
    this.belongsTo(UserGroup, {
      foreignKey: { name: 'groupId', field: 'group_id' },
    });
  }

  static hooks(Hooks, models) {
    hooks.add(this, Hooks, models);
  }

  static options() {
    return {
      modelName: 'userGroupMember',
      tableName: 'user_group_member',
      underscored: true,
      timestamps: false,
    };
  }
}

export default UserGroupMember;
