import { Model } from 'sequelize';

// One person's emoji reaction to one comment.
class CommentReaction extends Model {
  static fields(DataTypes) {
    const { INTEGER, STRING } = DataTypes;
    return {
      commentId: {
        type: INTEGER,
        field: 'comment_id',
        primaryKey: true,
        unique: 'comment_reaction_pkey',
      },
      userId: {
        type: INTEGER,
        field: 'user_id',
        primaryKey: true,
        unique: 'comment_reaction_pkey',
      },
      emoji: {
        type: STRING(32),
        primaryKey: true,
        allowNull: false,
        unique: 'comment_reaction_pkey',
      },
    };
  }

  static associate({ Comment, User }) {
    this.belongsTo(Comment, { foreignKey: 'commentId' });
    this.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  }

  static options() {
    return {
      modelName: 'commentReaction',
      tableName: 'comment_reaction',
      underscored: true,
      timestamps: true,
    };
  }
}

export default CommentReaction;
