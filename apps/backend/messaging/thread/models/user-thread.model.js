import { Model } from 'sequelize';

// User specific thread view / state.
class UserThread extends Model {
  static fields(DataTypes) {
    const { BOOLEAN, DATE, INTEGER } = DataTypes;
    return {
      threadId: {
        type: INTEGER,
        field: 'thread_id',
        primaryKey: true,
        unique: 'comment_thread_pkey',
      },
      userId: {
        type: INTEGER,
        field: 'user_id',
        primaryKey: true,
        unique: 'comment_thread_pkey',
      },
      isStarred: { type: BOOLEAN, allowNull: false, defaultValue: false },
      lastReadAt: {
        type: DATE,
        allowNull: false,
        defaultValue: new Date(0),
      },
    };
  }

  static associate({ Thread, User }) {
    this.belongsTo(Thread, { foreignKey: 'threadId' });
    this.belongsTo(User, { foreignKey: 'userId' });
  }

  static options() {
    return {
      modelName: 'userThread',
      tableName: 'comment_user_thread',
      underscored: true,
      timestamps: true,
    };
  }
}

export default UserThread;
