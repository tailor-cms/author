import { Model, Op } from 'sequelize';
import map from 'lodash/map.js';
import pick from 'lodash/pick.js';
import Promise from 'bluebird';
import { schema } from '@tailor-cms/config';

const { getRepositoryRelationships, getSchema } = schema;

class Repository extends Model {
  static fields(DataTypes) {
    const { BOOLEAN, DATE, JSONB, STRING, TEXT, UUID, UUIDV4 } = DataTypes;
    return {
      uid: {
        type: UUID,
        unique: true,
        defaultValue: UUIDV4,
      },
      schema: {
        type: STRING,
        validate: { notEmpty: true, len: [2, 20] },
      },
      name: {
        type: STRING,
        validate: { notEmpty: true, len: [2, 250] },
      },
      description: {
        type: TEXT,
        validate: { notEmpty: true, len: [2, 2000] },
      },
      data: {
        type: JSONB,
        defaultValue: {},
      },
      hasUnpublishedChanges: {
        type: BOOLEAN,
        field: 'has_unpublished_changes',
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

  static associate(db) {
    const {
      Activity,
      Comment,
      RepositoryUser,
      Revision,
      ContentElement,
      User,
      Tag,
      RepositoryTag,
    } = db;
    this.hasMany(Activity, {
      foreignKey: { name: 'repositoryId', field: 'repository_id' },
    });
    this.hasMany(Comment, {
      foreignKey: { name: 'repositoryId', field: 'repository_id' },
    });
    this.hasMany(ContentElement, {
      foreignKey: { name: 'repositoryId', field: 'repository_id' },
    });
    this.hasMany(Revision, {
      foreignKey: { name: 'repositoryId', field: 'repository_id' },
    });
    this.hasMany(RepositoryUser, {
      foreignKey: { name: 'repositoryId', field: 'repository_id' },
    });
    this.hasMany(RepositoryTag, {
      foreignKey: { name: 'repositoryId', field: 'repository_id' },
    });
    this.belongsToMany(Tag, {
      through: RepositoryTag,
      foreignKey: { name: 'repositoryId', field: 'repository_id' },
    });
    this.belongsToMany(User, {
      through: RepositoryUser,
      foreignKey: { name: 'repositoryId', field: 'repository_id' },
    });
  }

  static options() {
    return {
      modelName: 'repository',
      underscored: true,
      timestamps: true,
      paranoid: true,
      freezeTableName: true,
    };
  }

  static hooks(Hooks) {
    [Hooks.beforeCreate, Hooks.beforeUpdate, Hooks.beforeDestroy].forEach(
      (type) =>
        this.addHook(type, (repository, { context }) => {
          if (context) repository.hasUnpublishedChanges = true;
        }),
    );
  }

  async validateReferences(transaction) {
    const [activities, elements] = await this.getEntitiesWithRefs(transaction);
    const Activity = this.sequelize.model('Activity');
    const ContentElement = this.sequelize.model('ContentElement');
    return {
      activities: await Activity.detectMissingReferences(
        activities,
        transaction,
      ),
      elements: await ContentElement.detectMissingReferences(
        elements,
        transaction,
      ),
    };
  }

  async getEntitiesWithRefs(transaction) {
    const Activity = this.sequelize.model('Activity');
    const ContentElement = this.sequelize.model('ContentElement');
    const opts = { where: { repositoryId: this.id }, transaction };
    const relationships = getRepositoryRelationships(this.schema);
    const [activities, elements] = await Promise.all([
      Activity.scope({ method: ['withReferences', relationships] }).findAll(
        opts,
      ),
      ContentElement.scope('withReferences').findAll(opts),
    ]);
    return [activities, elements];
  }

  /**
   * Maps references for cloned activities and content elements.
   * @param {Object} mappings Dict where keys represent old and values new ids.
   * @param {SequelizeTransaction} [transaction]
   * @returns {Promise.<Object>} Object with mapped activities and elements.
   */
  async mapClonedReferences(mappings, transaction) {
    const [activities, elements] = await this.getEntitiesWithRefs(transaction);
    const relationships = getRepositoryRelationships(this.schema);
    return Promise.join(
      Promise.map(activities, (it) => {
        return it.mapClonedReferences(
          mappings.activityId,
          relationships,
          transaction,
        );
      }),
      Promise.map(elements, (it) =>
        it.mapClonedReferences(mappings, transaction),
      ),
      (activities, elements) => ({ activities, elements }),
    );
  }

  clone(name, description, context) {
    const Repository = this.sequelize.model('Repository');
    const Activity = this.sequelize.model('Activity');
    const srcAttributes = pick(this, ['schema', 'data']);
    const dstAttributes = Object.assign(srcAttributes, { name, description });
    return this.sequelize.transaction(async (transaction) => {
      const dst = await Repository.create(dstAttributes, {
        context,
        transaction,
      });
      const src = await Activity.findAll({
        where: { repositoryId: this.id, parentId: null },
        transaction,
      });
      const idMap = await Activity.cloneActivities(src, dst.id, null, {
        context,
        transaction,
      });
      await dst.mapClonedReferences(idMap, transaction);
      return dst;
    });
  }

  // Check if there is at least one outline activity with unpublished
  // changes and update repository model accordingly
  async updatePublishingStatus(excludedActivity) {
    const outlineTypes = map(schema.getOutlineLevels(this.schema), 'type');
    const where = {
      repositoryId: this.id,
      type: outlineTypes,
      detached: false,
      // Not published at all or has unpublished changes
      [Op.or]: [
        {
          publishedAt: { [Op.gt]: 0 },
          modifiedAt: { [Op.gt]: this.sequelize.col('published_at') },
        },
        { publishedAt: null, deletedAt: null },
      ],
    };
    if (excludedActivity) where.id = { [Op.ne]: excludedActivity.id };
    const Activity = this.sequelize.model('Activity');
    const unpublishedCount = await Activity.count({ where, paranoid: false });
    return this.update({ hasUnpublishedChanges: !!unpublishedCount });
  }

  getUser(user) {
    return this.getUsers({ where: { id: user.id } }).then((users) => users[0]);
  }

  getSchemaConfig() {
    return getSchema(this.schema);
  }
}

export default Repository;
