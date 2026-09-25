import { Model } from 'sequelize';

class Emoji extends Model {
  static fields(DataTypes) {
    const { BOOLEAN, STRING } = DataTypes;
    return {
      name: { type: STRING(30), allowNull: false, unique: true },
      contentHash: { type: STRING(32), allowNull: false },
      isAnimated: { type: BOOLEAN, allowNull: false, defaultValue: false },
    };
  }

  static associate({ User }) {
    this.belongsTo(User, { as: 'createdBy', foreignKey: 'createdById' });
  }

  static options() {
    return {
      modelName: 'emoji',
      tableName: 'emoji',
      underscored: true,
      timestamps: true,
    };
  }
}

export default Emoji;
