'use strict';

const TABLE_NAME = 'asset';

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable(TABLE_NAME, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      uid: {
        type: Sequelize.UUID,
        unique: true,
        defaultValue: Sequelize.UUIDV4,
      },
      repositoryId: {
        type: Sequelize.INTEGER,
        field: 'repository_id',
        references: { model: 'repository', key: 'id' },
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(16),
        allowNull: false,
      },
      storageKey: {
        type: Sequelize.STRING(1024),
        field: 'storage_key',
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      vectorStoreFileId: {
        type: Sequelize.STRING,
        field: 'vector_store_file_id',
        allowNull: true,
      },
      processingStatus: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        field: 'processing_status',
        allowNull: true,
      },
      meta: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      uploadedBy: {
        type: Sequelize.INTEGER,
        field: 'uploaded_by',
        references: { model: 'user', key: 'id' },
      },
      createdAt: {
        type: Sequelize.DATE,
        field: 'created_at',
      },
      updatedAt: {
        type: Sequelize.DATE,
        field: 'updated_at',
      },
      deletedAt: {
        type: Sequelize.DATE,
        field: 'deleted_at',
      },
    }),
  down: (queryInterface) => queryInterface.dropTable(TABLE_NAME),
};
