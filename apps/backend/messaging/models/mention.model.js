import { Model } from 'sequelize';

// A user mentioned inside a message
class Mention extends Model {
  static fields(DataTypes) {
    const { DATE, INTEGER } = DataTypes;
    return {
      commentId: {
        type: INTEGER,
        field: 'comment_id',
        primaryKey: true,
        unique: 'comment_mention_pkey',
      },
      userId: {
        type: INTEGER,
        field: 'user_id',
        primaryKey: true,
        unique: 'comment_mention_pkey',
      },
      readAt: { type: DATE },
    };
  }

  static associate({ Comment, User }) {
    this.belongsTo(Comment, { foreignKey: 'commentId' });
    this.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  }

  static options() {
    return {
      modelName: 'mention',
      tableName: 'comment_mention',
      underscored: true,
      timestamps: true,
    };
  }
}

export default Mention;
