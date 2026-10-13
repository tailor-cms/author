'use strict';

// Custom emoji support
exports.up = async (qi, Sequelize) => {
  await qi.createTable('emoji', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    // Lowercase and URL-safe, stored without its colons.
    name: { type: Sequelize.STRING(30), allowNull: false, unique: true },
    content_hash: { type: Sequelize.STRING(32), allowNull: false },
    is_animated: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_by_id: {
      type: Sequelize.INTEGER,
      references: { model: 'user', key: 'id' },
      onDelete: 'SET NULL',
    },
    created_at: { type: Sequelize.DATE, allowNull: false },
    updated_at: { type: Sequelize.DATE, allowNull: false },
  });
  await qi.addIndex('emoji', {
    name: 'emoji_content_hash_idx',
    fields: ['content_hash'],
  });
};

exports.down = (qi) => qi.dropTable('emoji');
