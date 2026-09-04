import { Comment as Events } from '@tailor-cms/common/src/sse.js';
import { CommentType } from '@tailor-cms/interfaces/comment';
import { Model } from 'sequelize';
import hooks from './comment.hooks.ts';

class Comment extends Model {
  static fields(DataTypes) {
    const { BOOLEAN, DATE, ENUM, JSONB, STRING, TEXT, UUID, UUIDV4 } =
      DataTypes;
    return {
      uid: {
        type: UUID,
        unique: true,
        allowNull: false,
        defaultValue: UUIDV4,
      },
      // `user` for a person, `integration` for a non-human post
      type: {
        type: ENUM(CommentType.User, CommentType.Integration),
        allowNull: false,
        defaultValue: CommentType.User,
      },
      content: {
        type: TEXT,
        allowNull: false,
        validate: { len: [1, 2000] },
        get() {
          if (this.getDataValue('deletedAt')) {
            return 'This comment has been deleted';
          }
          return this.getDataValue('content');
        },
      },
      // For integration posts
      senderName: { type: STRING },
      senderEmoji: { type: STRING },
      // Slack-compatible attachment payload
      attachments: { type: JSONB },
      // A reply the author also wanted to be shown in the thread
      isBroadcast: { type: BOOLEAN, allowNull: false, defaultValue: false },
      editedAt: { type: DATE },
      resolvedAt: { type: DATE },
    };
  }

  static hooks(Hooks, models) {
    hooks.add(this, Hooks, models);
  }

  static associate({
    Activity,
    CommentReaction,
    ContentElement,
    Integration,
    Mention,
    Repository,
    Thread,
    User,
  }) {
    this.belongsTo(Repository, { foreignKey: 'repositoryId' });
    this.belongsTo(Thread, { as: 'thread', foreignKey: 'threadId' });
    this.belongsTo(Activity, { foreignKey: 'activityId' });
    this.belongsTo(ContentElement, {
      as: 'contentElement',
      foreignKey: 'contentElementId',
    });
    this.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
    this.belongsTo(Integration, {
      as: 'integration',
      foreignKey: 'integrationId',
    });
    // The person an integration post is about; "Jane published the
    // course". The post itself has no author.
    this.belongsTo(User, { as: 'actor', foreignKey: 'actorId' });
    // Replies hang off a message one level deep.
    this.belongsTo(this, { as: 'parent', foreignKey: 'parentId' });
    this.hasMany(this, { as: 'replies', foreignKey: 'parentId' });
    this.hasMany(Mention, { as: 'mentions', foreignKey: 'commentId' });
    this.hasMany(CommentReaction, {
      as: 'reactions',
      foreignKey: 'commentId',
    });
  }

  static options() {
    return {
      modelName: 'comment',
      underscored: true,
      timestamps: true,
      paranoid: true,
      freezeTableName: true,
    };
  }

  static get Events() {
    return Events;
  }
}

export default Comment;
