import { Model } from 'sequelize';

class Tag extends Model {
  static fields({ STRING, UUID, UUIDV4 }) {
    return {
      uid: {
        type: UUID,
        unique: true,
        allowNull: false,
        defaultValue: UUIDV4,
      },
      name: {
        type: STRING,
        allowNull: false,
        unique: true,
        validate: { notEmpty: true, len: [2, 20] },
      },
    };
  }

  static associate({ Repository, RepositoryTag }) {
    this.belongsToMany(Repository, {
      through: RepositoryTag,
      foreignKey: { name: 'tagId', field: 'tag_id' },
    });
  }

  static options() {
    return {
      modelName: 'tag',
      underscored: true,
      freezeTableName: true,
      timestamps: false,
    };
  }
}

export default Tag;
