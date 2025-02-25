import { Model } from 'sequelize';

class RepositoryUserGroup extends Model {
  static fields({ INTEGER }) {
    return {
      repositoryId: {
        type: INTEGER,
        field: 'repository_id',
        primaryKey: true,
        unique: 'repository_user_group_pkey',
      },
      groupId: {
        type: INTEGER,
        field: 'group_id',
        primaryKey: true,
        unique: 'repository_user_group_pkey',
      },
    };
  }

  static associate({ Repository, UserGroup }) {
    this.belongsTo(Repository, {
      foreignKey: { name: 'repositoryId', field: 'repository_id' },
    });
    this.belongsTo(UserGroup, {
      foreignKey: { name: 'groupId', field: 'group_id' },
    });
  }

  static options() {
    return {
      modelName: 'repositoryUserGroup',
      tableName: 'repository_user_group',
      underscored: true,
      timestamps: false,
    };
  }
}

export default RepositoryUserGroup;
