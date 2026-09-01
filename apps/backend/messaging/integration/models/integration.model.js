import { IntegrationType } from '@tailor-cms/interfaces/comment';
import { Model } from 'sequelize';

// Built-in and external integrations both post as an integration.
// Where it posts is up to the thread, which subscribes to `integration:<key>`.
class Integration extends Model {
  static fields(DataTypes) {
    const { BOOLEAN, ENUM, STRING } = DataTypes;
    return {
      key: { type: STRING, allowNull: false },
      name: { type: STRING, allowNull: false },
      icon: { type: STRING },
      type: {
        type: ENUM(IntegrationType.Builtin, IntegrationType.External),
        allowNull: false,
      },
      // inbound webhook tokens are matched against this digest.
      tokenHash: { type: STRING },
      isEnabled: { type: BOOLEAN, allowNull: false, defaultValue: true },
    };
  }

  static associate({ Repository, User }) {
    this.belongsTo(Repository, { foreignKey: 'repositoryId' });
    this.belongsTo(User, { as: 'createdBy', foreignKey: 'createdById' });
  }

  static options() {
    return {
      modelName: 'integration',
      tableName: 'comment_integration',
      underscored: true,
      timestamps: true,
    };
  }
}

export default Integration;
