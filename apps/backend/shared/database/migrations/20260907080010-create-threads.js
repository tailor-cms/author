'use strict';

// Messaging threads
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

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false },
  updated_at: { type: Sequelize.DATE, allowNull: false },
});

// What a comment needs to belong to a thread
const COMMENT_COLUMNS = (Sequelize) => ({
  thread_id: fk(Sequelize, 'comment_thread', 'CASCADE'),
  // One level deep: a reply to a reply is pinned back to the root.
  parent_id: fk(Sequelize, 'comment', 'CASCADE'),
  // A reply the author also sent to the channel.
  is_broadcast: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

const COMMENT_INDEXES = [
  {
    name: 'comment_repository_created_idx',
    fields: ['repository_id', { name: 'created_at', order: 'DESC' }],
  },
  { name: 'comment_thread_created_idx', fields: ['thread_id', 'created_at'] },
  { name: 'comment_parent_id_idx', fields: ['parent_id'] },
];

exports.up = async (qi, Sequelize) => {
  await qi.createTable('comment_thread', {
    id: pk(Sequelize),
    repository_id: fk(Sequelize, 'repository', 'CASCADE', false),
    // If thread is anchored
    activity_id: fk(Sequelize, 'activity', 'SET NULL'),
    content_element_id: fk(Sequelize, 'content_element', 'SET NULL'),
    type: {
      type: Sequelize.ENUM('REPOSITORY', 'ACTIVITY', 'ELEMENT'),
      allowNull: false,
    },
    // Only a repository discussion names itself; the rest borrow the
    // name of what they are anchored to.
    title: { type: Sequelize.TEXT },
    message_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    // An anchored thread reads as resolved once this reaches zero.
    unresolved_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    participant_ids: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: false,
      defaultValue: [],
    },
    // Integrations or other external sources that post to this thread.
    subscriptions: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: [],
    },
    last_message_at: { type: Sequelize.DATE },
    ...timestamps(Sequelize),
  });

  // A repository thread is opened with a subject, anchored threads
  // borrow the title from their anchor.
  await qi.addConstraint('comment_thread', {
    name: 'comment_thread_title_check',
    type: 'check',
    fields: ['type', 'title'],
    where: {
      [Sequelize.Op.or]: [
        { type: { [Sequelize.Op.ne]: 'REPOSITORY' } },
        { title: { [Sequelize.Op.ne]: null } },
      ],
    },
  });
  // One thread per anchored entity.
  await qi.addIndex('comment_thread', {
    name: 'comment_thread_element_uniq',
    fields: ['repository_id', 'content_element_id'],
    unique: true,
    where: { content_element_id: { [Sequelize.Op.ne]: null } },
  });
  await qi.addIndex('comment_thread', {
    name: 'comment_thread_activity_uniq',
    fields: ['repository_id', 'activity_id'],
    unique: true,
    where: { type: 'ACTIVITY' },
  });
  // Matches the ordering of recent threads in the sidebar.
  await qi.addIndex('comment_thread', {
    name: 'comment_thread_recent_idx',
    fields: [
      'repository_id',
      { name: 'last_message_at', order: 'DESC NULLS LAST' },
    ],
  });
  await qi.addIndex('comment_thread', {
    name: 'comment_thread_subscriptions_idx',
    fields: ['subscriptions'],
    using: 'gin',
  });
  await qi.addIndex('comment_thread', {
    name: 'comment_thread_participants_idx',
    fields: ['participant_ids'],
    using: 'gin',
  });

  // User-specific thread state.
  await qi.createTable('comment_user_thread', {
    thread_id: {
      ...fk(Sequelize, 'comment_thread', 'CASCADE', false),
      primaryKey: true,
    },
    user_id: {
      ...fk(Sequelize, 'user', 'CASCADE', false),
      primaryKey: true,
    },
    last_read_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: new Date(0),
    },
    is_starred: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    ...timestamps(Sequelize),
  });
  await qi.addIndex('comment_user_thread', {
    name: 'comment_user_thread_starred_idx',
    fields: ['user_id'],
    where: { is_starred: true },
  });

  // Who a message named
  await qi.createTable('comment_mention', {
    comment_id: {
      ...fk(Sequelize, 'comment', 'CASCADE', false),
      primaryKey: true,
    },
    user_id: {
      ...fk(Sequelize, 'user', 'CASCADE', false),
      primaryKey: true,
    },
    // Its own read state, independent of the thread watermark.
    read_at: { type: Sequelize.DATE },
    ...timestamps(Sequelize),
  });
  await qi.addIndex('comment_mention', {
    name: 'comment_mention_inbox_idx',
    fields: ['user_id', 'read_at'],
  });

  for (const [name, column] of Object.entries(COMMENT_COLUMNS(Sequelize))) {
    await qi.addColumn('comment', name, column);
  }
  for (const index of COMMENT_INDEXES) {
    await qi.addIndex('comment', index);
  }

  await addSearch(qi);
  await backfill(qi);
};

/**
 * Full-text search sees the label of a reference token; a second index
 * finds the tokens themselves.
 */
async function addSearch(qi) {
  await qi.sequelize.query(`
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    ALTER TABLE comment ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (to_tsvector(
        'english',
        regexp_replace(coalesce(content, ''), '<[@#][^|>]*[|]', ' ', 'g')
      )) STORED;
  `);
  await qi.addIndex('comment', {
    name: 'comment_search_vector_idx',
    fields: ['search_vector'],
    using: 'gin',
  });
  await qi.addIndex('comment', {
    name: 'comment_references_idx',
    fields: [{ name: 'content', operator: 'gin_trgm_ops' }],
    using: 'gin',
  });
}

/**
 * Backfills threads and user-thread relationships based on existing comments.
 */
async function backfill(qi) {
  const insertThreads = ({ type, activity, element, where, groupBy }) =>
    qi.sequelize.query(`
      INSERT INTO comment_thread
        (repository_id, type, activity_id, content_element_id,
         message_count, unresolved_count,
         participant_ids, last_message_at, created_at, updated_at)
      SELECT c.repository_id, '${type}', ${activity}, ${element},
             COUNT(*),
             COUNT(*) FILTER (WHERE c.resolved_at IS NULL),
             COALESCE(ARRAY_AGG(DISTINCT c.author_id)
               FILTER (WHERE c.author_id IS NOT NULL), '{}'),
             MAX(c.created_at), MIN(c.created_at), NOW()
        FROM comment c
       WHERE ${where}
       GROUP BY ${groupBy};
    `);

  await insertThreads({
    type: 'ELEMENT',
    activity: 'MIN(c.activity_id)',
    element: 'c.content_element_id',
    where: 'c.deleted_at IS NULL AND c.content_element_id IS NOT NULL',
    groupBy: 'c.repository_id, c.content_element_id',
  });

  await insertThreads({
    type: 'ACTIVITY',
    activity: 'c.activity_id',
    element: 'NULL',
    where: `c.deleted_at IS NULL AND c.content_element_id IS NULL
             AND c.activity_id IS NOT NULL`,
    groupBy: 'c.repository_id, c.activity_id',
  });

  await qi.sequelize.query(`
    UPDATE comment c SET thread_id = t.id
      FROM comment_thread t
     WHERE t.repository_id = c.repository_id
       AND ((c.content_element_id IS NOT NULL
             AND t.content_element_id = c.content_element_id)
         OR (c.content_element_id IS NULL AND c.activity_id IS NOT NULL
             AND t.type = 'ACTIVITY'
             AND t.activity_id = c.activity_id));
  `);

  await qi.sequelize.query(`
    INSERT INTO comment_user_thread
      (thread_id, user_id, last_read_at, created_at, updated_at)
    SELECT thread_id, author_id, MAX(created_at), NOW(), NOW()
      FROM comment
     WHERE deleted_at IS NULL AND thread_id IS NOT NULL
       AND author_id IS NOT NULL
     GROUP BY thread_id, author_id
    ON CONFLICT (thread_id, user_id) DO NOTHING;
  `);
}

exports.down = async (qi, Sequelize) => {
  await qi.removeIndex('comment', 'comment_references_idx');
  await qi.removeIndex('comment', 'comment_search_vector_idx');
  await qi.removeColumn('comment', 'search_vector');
  for (const { name } of COMMENT_INDEXES) {
    await qi.removeIndex('comment', name);
  }
  for (const name of Object.keys(COMMENT_COLUMNS(Sequelize)).reverse()) {
    await qi.removeColumn('comment', name);
  }
  await qi.dropTable('comment_mention');
  await qi.dropTable('comment_user_thread');
  await qi.dropTable('comment_thread');
  await qi.dropEnum('enum_comment_thread_type');
};
