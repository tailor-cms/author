'use strict';

// A non-human message posting identity.
const pk = (Sequelize) => ({
  type: Sequelize.INTEGER,
  primaryKey: true,
  autoIncrement: true,
});

const fk = (Sequelize, model, onDelete, allowNull = true) => ({
  type: Sequelize.INTEGER,
  references: { model, key: 'id' },
  allowNull,
  onDelete,
});

// What a comment needs to have come from an integration.
const COMMENT_COLUMNS = (Sequelize) => ({
  type: {
    type: Sequelize.ENUM('USER', 'INTEGRATION'),
    allowNull: false,
    defaultValue: 'USER',
  },
  integration_id: fk(Sequelize, 'comment_integration', 'SET NULL'),
  // Who caused the thing announced
  actor_id: fk(Sequelize, 'user', 'SET NULL'),
  // Slack-shaped attachment payload, rendered as cards.
  attachments: { type: Sequelize.JSONB },
  // Per-post overrides
  sender_name: { type: Sequelize.STRING },
  sender_emoji: { type: Sequelize.STRING },
});

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false },
  updated_at: { type: Sequelize.DATE, allowNull: false },
});

exports.up = async (qi, Sequelize) => {
  await qi.createTable('comment_integration', {
    id: pk(Sequelize),
    repository_id: fk(Sequelize, 'repository', 'CASCADE'),
    created_by_id: fk(Sequelize, 'user', 'SET NULL'),
    key: { type: Sequelize.STRING, allowNull: false },
    name: { type: Sequelize.STRING, allowNull: false },
    icon: { type: Sequelize.STRING },
    type: {
      type: Sequelize.ENUM('BUILTIN', 'EXTERNAL'),
      allowNull: false,
    },
    token_hash: { type: Sequelize.STRING },
    is_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    ...timestamps(Sequelize),
  });
  // A key is unique per repository. Built-in integrations have no
  // repository id, so they need an index of their own to stop a key
  // being taken twice.
  await qi.addIndex('comment_integration', {
    name: 'comment_integration_repository_key_uniq',
    fields: ['repository_id', 'key'],
    unique: true,
    where: { repository_id: { [Sequelize.Op.ne]: null } },
  });
  await qi.addIndex('comment_integration', {
    name: 'comment_integration_global_key_uniq',
    fields: ['key'],
    unique: true,
    where: { repository_id: null },
  });
  await qi.addIndex('comment_integration', {
    name: 'comment_integration_token_idx',
    fields: ['token_hash'],
  });
  for (const [name, column] of Object.entries(COMMENT_COLUMNS(Sequelize))) {
    await qi.addColumn('comment', name, column);
  }
  await qi.changeColumn('comment', 'author_id', {
    type: Sequelize.INTEGER,
    allowNull: true,
  });
};

exports.down = async (qi, Sequelize) => {
  for (const name of Object.keys(COMMENT_COLUMNS(Sequelize)).reverse()) {
    await qi.removeColumn('comment', name);
  }
  await qi.changeColumn('comment', 'author_id', {
    type: Sequelize.INTEGER,
    allowNull: false,
  });
  await qi.dropTable('comment_integration');
  await qi.dropEnum('enum_comment_type');
  await qi.dropEnum('enum_comment_integration_type');
};
