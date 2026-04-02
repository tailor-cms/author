import { AssetType, ProcessingStatus } from '@tailor-cms/interfaces/asset.ts';
import { Model } from 'sequelize';
import Storage from '../repository/storage.js';

export { AssetType, ProcessingStatus };

class Asset extends Model {
  static fields(DataTypes) {
    const { DATE, ENUM, JSONB, STRING, UUID, UUIDV4, VIRTUAL } = DataTypes;
    return {
      uid: {
        type: UUID,
        unique: true,
        defaultValue: UUIDV4,
      },
      name: {
        type: STRING,
        allowNull: false,
        set(val) {
          // STRING defaults to 255 chars in PostgreSQL;
          // cap at 250 to leave room for ellipsis
          const max = 250;
          const truncated = val.length > max
            ? `${val.slice(0, max - 3)}...`
            : val;
          this.setDataValue('name', truncated);
        },
      },
      type: {
        // String instead of ENUM to allow future types without DB migration
        type: STRING(16),
        allowNull: false,
      },
      storageKey: {
        type: STRING(255),
        field: 'storage_key',
        allowNull: true,
      },
      publicUrl: {
        type: VIRTUAL,
      },
      meta: {
        type: JSONB,
        defaultValue: {},
      },
      vectorStoreFileId: {
        type: STRING,
        field: 'vector_store_file_id',
        allowNull: true,
      },
      processingStatus: {
        type: ENUM('pending', 'processing', 'completed', 'failed'),
        field: 'processing_status',
        allowNull: true,
      },
      createdAt: {
        type: DATE,
        field: 'created_at',
      },
      updatedAt: {
        type: DATE,
        field: 'updated_at',
      },
      deletedAt: {
        type: DATE,
        field: 'deleted_at',
      },
    };
  }

  static async resolvePublicUrls(assets) {
    const withKeys = assets.filter((a) => a.storageKey);
    await Promise.all(
      withKeys.map(async (a) => {
        a.publicUrl = await Storage.getFileUrl(a.storageKey).catch(() => null);
      }),
    );
    return assets;
  }

  static associate({ Repository, User }) {
    this.belongsTo(Repository, {
      foreignKey: { name: 'repositoryId', field: 'repository_id' },
    });
    this.belongsTo(User, {
      as: 'uploader',
      foreignKey: { name: 'uploadedBy', field: 'uploaded_by' },
    });
  }

  static options() {
    return {
      modelName: 'asset',
      tableName: 'asset',
      underscored: true,
      timestamps: true,
      paranoid: true,
      freezeTableName: true,
    };
  }
}

export default Asset;
