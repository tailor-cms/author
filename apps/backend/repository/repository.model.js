import isArray from 'lodash/isArray.js';
import isNumber from 'lodash/isNumber.js';
import { Model } from 'sequelize';
import pick from 'lodash/pick.js';
import Promise from 'bluebird';
import { schema } from 'tailor-config-shared';
import uniq from 'lodash/uniq.js';

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
    const Activity = this.sequelize.model('Activity');
    const ContentElement = this.sequelize.model('ContentElement');
    // Extract references from entity with refs object.
    // Each reference is represented as an object with entityId, id and
    // type. The type is the key of the reference in the refs object,
    // id is the id of the referenced entity and entityId is the id of
    // the entity that contains the reference.
    const processReferences = (item) => {
      const processRefEntry = (entry) => {
        if (isNumber(entry)) return [entry];
        if (isArray(entry))
          return entry.map((it) => (isNumber(it) ? it : it.id));
        return [entry.id];
      };
      const relationshipKeys = Object.keys(item.refs);
      return relationshipKeys.reduce((acc, key) => {
        const references = item.refs[key];
        if (!references) return acc;
        const relatedEntityIds = processRefEntry(item.refs[key]);
        acc.push(
          ...relatedEntityIds.map((id) => ({
            entity: item,
            id,
            type: key,
          })),
        );
        return acc;
      }, []);
    };
    // Extract references from array of entities.
    // Entities can be activities or content elements.
    const extractReferences = (items) =>
      items.reduce((acc, it) => {
        acc.push(...processReferences(it));
        return acc;
      }, []);
    // Fetch all repo entities with references.
    const [activities, elements] = await this.getEntitiesWithRefs(transaction);
    // Extract referenced activity and element ids.
    const activityRefMappings = extractReferences(activities);
    const referencedActivityIds = uniq(activityRefMappings.map((it) => it.id));
    const elementRefMappings = extractReferences(elements);
    const referencedElementIds = uniq(elementRefMappings.map((it) => it.id));
    // Fetch referenced activities and elements.
    const referencedActivities = await Activity.findAll({
      where: { id: referencedActivityIds },
      attributes: ['id'],
      transaction,
    });
    const referencedElements = await ContentElement.findAll({
      where: { id: referencedElementIds },
      attributes: ['id'],
      transaction,
    });
    // Check if all elements referenced within mappings are present in the
    // entities array.
    const detectMissingReferences = (mappings, entities) => {
      return mappings.filter((it) => !entities.find((el) => el.id === it.id));
    };
    const faultyActivities = detectMissingReferences(
      activityRefMappings,
      referencedActivities,
    );
    const faultyElements = detectMissingReferences(
      elementRefMappings,
      referencedElements,
    );
    await Promise.each(faultyElements, async (it) => {
      const activity = await Activity.findByPk(it.entity.activityId);
      it.outlineActivity = await activity.getFirstOutlineItem();
      return it;
    });
    return { activities: faultyActivities, elements: faultyElements };
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

  getUser(user) {
    return this.getUsers({ where: { id: user.id } }).then((users) => users[0]);
  }

  getSchemaConfig() {
    return getSchema(this.schema);
  }
}

export default Repository;
