import { Model } from 'sequelize';

class UserGroupMember extends Model {
  static fields({ INTEGER }) {
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
