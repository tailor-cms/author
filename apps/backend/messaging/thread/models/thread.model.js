import { Model } from 'sequelize';
import { ThreadType } from '@tailor-cms/interfaces/comment';

// A conversation thread is a collection of comments. It belongs to a repository and may be attached
// to an activity or content element.
class Thread extends Model {
  static fields(DataTypes) {
    const { ARRAY, DATE, ENUM, INTEGER, STRING, TEXT } = DataTypes;
    return {
      type: {
        type: ENUM(
          ThreadType.Repository,
          ThreadType.Activity,
          ThreadType.Element,
        ),
        allowNull: false,
      },
      // Only a repository discussion has a name;
      // the rest have references to the entity they are attached to.
      title: { type: TEXT },
      messageCount: { type: INTEGER, allowNull: false, defaultValue: 0 },
      // How many are still open. An anchored thread is resolved once this
      // hits zero, and an element's comments stop showing on it. Always 0
      // on a free-standing thread, which has nothing to resolve.
      unresolvedCount: { type: INTEGER, allowNull: false, defaultValue: 0 },
      // What this thread subscribes to: event types, or `integration:<key>`.
      subscriptions: {
        type: ARRAY(STRING),
        allowNull: false,
        defaultValue: [],
      },
      // User IDs of participants in the thread.
      participantIds: {
        type: ARRAY(INTEGER),
        allowNull: false,
        defaultValue: [],
      },
      lastMessageAt: { type: DATE },
    };
  }

  static associate({
    Activity,
    Comment,
    ContentElement,
    Repository,
    UserThread,
  }) {
    this.hasMany(Comment, { as: 'comments', foreignKey: 'threadId' });
    this.hasOne(UserThread, { as: 'reader', foreignKey: 'threadId' });
    this.belongsTo(Repository, { foreignKey: 'repositoryId' });
    this.belongsTo(Activity, { foreignKey: 'activityId' });
    this.belongsTo(ContentElement, {
      foreignKey: 'contentElementId',
      as: 'contentElement',
    });
  }

  static options() {
    return {
      modelName: 'thread',
      tableName: 'comment_thread',
      underscored: true,
      timestamps: true,
    };
  }
}

export default Thread;
