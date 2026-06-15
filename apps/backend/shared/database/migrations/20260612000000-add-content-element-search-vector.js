'use strict';

const TABLE_NAME = 'content_element';
const COLUMN_NAME = 'search_vector';
const INDEX_NAME = 'content_element_search_vector_idx';

// Generated column indexing every string value inside the `data` JSONB
// for full-text search.
exports.up = async (qi) => {
  await qi.sequelize.query(`
    ALTER TABLE ${TABLE_NAME} ADD COLUMN ${COLUMN_NAME} tsvector
    GENERATED ALWAYS AS (jsonb_to_tsvector('english', data, '["string"]')) STORED
  `);
  await qi.sequelize.query(`
    CREATE INDEX ${INDEX_NAME} ON ${TABLE_NAME} USING GIN (${COLUMN_NAME})
  `);
};

exports.down = async (qi) => {
  await qi.sequelize.query(`DROP INDEX IF EXISTS ${INDEX_NAME}`);
  await qi.removeColumn(TABLE_NAME, COLUMN_NAME);
};
