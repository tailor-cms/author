'use strict';

// One person's emoji reaction to one comment.
const ck = (Sequelize, model) => ({
  type: Sequelize.INTEGER,
  allowNull: false,
  primaryKey: true,
  references: { model, key: 'id' },
  onDelete: 'CASCADE',
});

exports.up = async (qi, Sequelize) => {
  await qi.createTable('comment_reaction', {
    comment_id: ck(Sequelize, 'comment'),
    user_id: ck(Sequelize, 'user'),
    emoji: {
      type: Sequelize.STRING(32),
      allowNull: false,
      primaryKey: true,
    },
    created_at: { type: Sequelize.DATE, allowNull: false },
    updated_at: { type: Sequelize.DATE, allowNull: false },
  });
};

exports.down = (qi) => qi.dropTable('comment_reaction');
