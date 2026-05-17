import { Model } from 'sequelize';

class UserGroup extends Model {
  static fields({ STRING, TEXT }) {
    return {
      name: {
        type: STRING,
        unique: true,
        allowNull: false,
        validate: { notEmpty: true, len: [2, 250] },
      },
      logoUrl: {
        type: TEXT,
        field: 'logo_url',
      },
    };
  }

  static associate({ Repository, RepositoryUserGroup, User, UserGroupMember }) {
    this.hasMany(UserGroupMember, {
      foreignKey: { name: 'groupId', field: 'group_id' },
    });
    this.belongsToMany(User, {
      through: UserGroupMember,
      foreignKey: { name: 'groupId', field: 'group_id' },
    });
    this.belongsToMany(Repository, {
      through: RepositoryUserGroup,
      foreignKey: { name: 'groupId', field: 'group_id' },
    });
  }

  static options() {
    return {
      modelName: 'userGroup',
      tableName: 'user_group',
      underscored: true,
      freezeTableName: true,
      timestamps: false,
    };
  }
}

export default UserGroup;
