import { literal, Model, Op } from 'sequelize';
import { register as registerSchema, schema } from '@tailor-cms/config';
import first from 'lodash/first.js';
import hooks from './repository.hooks.ts';
import intersection from 'lodash/intersection.js';
import map from 'lodash/map.js';
import pick from 'lodash/pick.js';
import set from 'lodash/fp/set.js';
import Promise from 'bluebird';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';
import { RepositoryRole } from '@tailor-cms/interfaces/role';
import { syncSchemaSnapshot } from '../lib/schema.ts';
import { stripInstanceSpecific } from '../lib/data-attr.ts';

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
      Asset,
      Comment,
      RepositoryUser,
      Revision,
      ContentElement,
      User,
      UserGroup,
      Tag,
      RepositoryTag,
      RepositoryUserGroup,
    } = db;
    this.hasMany(Activity, {
      foreignKey: { name: 'repositoryId', field: 'repository_id' },
    });
    this.hasMany(Comment, {
      foreignKey: { name: 'repositoryId', field: 'repository_id' },
    });
    this.hasMany(Asset, {
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
    this.hasMany(RepositoryUserGroup, {
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
    this.belongsToMany(UserGroup, {
      through: RepositoryUserGroup,
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

  static hooks(Hooks, models) {
    hooks.add(this, Hooks, models);
  }

  static async createByUser(data, { context, transaction } = {}) {
    const RepositoryUser = this.sequelize.model('RepositoryUser');
    const repository = await Repository.create(data, {
      context,
      returning: true,
      transaction,
    });
    await RepositoryUser.create(
      {
        userId: context.userId,
        repositoryId: repository.id,
        role: RepositoryRole.ADMIN,
        hasAccess: true,
      },
      { transaction },
    );
    // Snapshot the schema config so the repository can survive a future
    // removal of `data.schema` from the registry. No-op for paste-mode
    // (caller pre-populated data.$$.schema with an unregistered id).
    await syncSchemaSnapshot(repository, transaction);
    return repository;
  }

  async syncSchemaSnapshot(transaction) {
    return syncSchemaSnapshot(this, transaction);
  }

  async hasAccess(user) {
    const UserGroup = this.sequelize.model('UserGroup');
    // If user is a system admin, allow all
    if (user.isAdmin()) return true;
    // Get user relationship with the repository, if exists allow access
    const userRelationship = first(
      await this.getRepositoryUsers({
        where: { userId: user.id, hasAccess: true },
      }),
    );
    if (userRelationship) return true;
    // Check if user is a member of any user group that has access to the repository
    // Check if userGroups are loaded
    if (this.userGroups === undefined) {
      await this.reload({ include: [{ model: UserGroup, required: false }] });
    }
    const repositoryGroupIds = this.userGroups.map((it) => it.id);
    const userGroupIds = user.userGroups.map((it) => it.id);
    if (intersection(repositoryGroupIds, userGroupIds).length) return true;
    // If none of the above conditions are met, deny access
    return false;
  }

  /**
   * Ensures `data.$$.ai.storeId` is populated. Returns the persisted
   * id - the existing one if another writer already set it, or
   * `storeId` if we won the race. Compare against the argument to
   * detect "we won" vs "we lost" and clean up the orphaned vector
   * store accordingly.
   */
  async setVectorStoreId(storeId) {
    const fresh = await Repository.findByPk(this.id);
    const existing = fresh?.data?.$$?.ai?.storeId;
    if (existing) return existing;
    const nextData = set('$$.ai.storeId', storeId, fresh?.data ?? {});
    const [count] = await Repository.update(
      { data: nextData },
      {
        where: {
          id: this.id,
          // `$$$$` in the literal -> `$$` in the emitted SQL. Sequelize's
          // bind-token parser treats `$$` as an escape for a literal `$`;
          // without the doubling, the WHERE would look at `data.$.ai...`
          [Op.and]: literal(`data->'$$$$'->'ai'->'storeId' IS NULL`),
        },
        hooks: false,
      },
    );
    await this.reload();
    if (count > 0) return storeId;
    // Race: another writer slipped in between our read and our update.
    return this.data?.$$?.ai?.storeId ?? null;
  }

  getVectorStoreId() {
    return this.data?.$$?.ai?.storeId ?? null;
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

  async clone(name, description, options) {
    const { context, shareWithSamePeople = false } = options;
    const Repository = this.sequelize.model('Repository');
    const Activity = this.sequelize.model('Activity');
    const srcAttributes = pick(this, ['schema', 'data']);
    // Strip instance-specific paths (e.g. $$.ai vector store id) so the
    // clone starts with fresh AI state. $$.schema is preserved so the
    // clone keeps the snapshot/paste-mode lifeline.
    srcAttributes.data = stripInstanceSpecific(srcAttributes.data);
    const dstAttributes = Object.assign(srcAttributes, { name, description });
    const transaction = await this.sequelize.transaction();
    const dst = await Repository.createByUser(dstAttributes, {
      context,
      transaction,
    });
    if (shareWithSamePeople) await this.copyAccessTo(dst, context, transaction);
    const src = await Activity.findAll({
      where: { repositoryId: this.id, parentId: null },
      transaction,
    });
    const idMap = await Activity.cloneActivities(src, dst.id, null, {
      context,
      transaction,
    });
    await dst.mapClonedReferences(idMap, transaction);
    await transaction.commit();
    return dst;
  }

  /**
   * Shares the given repository with everyone that can access this one;
   * links it to the same user groups and grants the active members their
   * current roles. The acting user keeps the ADMIN membership created
   * alongside the clone.
   */
  async copyAccessTo(dst, context, transaction) {
    const RepositoryUser = this.sequelize.model('RepositoryUser');
    const userGroups = await this.getUserGroups({ transaction });
    if (userGroups.length) await dst.setUserGroups(userGroups, { transaction });
    const memberships = await this.getRepositoryUsers({
      where: { hasAccess: true, userId: { [Op.ne]: context.userId } },
      transaction,
    });
    if (!memberships.length) return;
    await RepositoryUser.bulkCreate(
      memberships.map((it) => ({
        userId: it.userId,
        repositoryId: dst.id,
        role: it.role,
        hasAccess: true,
      })),
      { transaction },
    );
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

  async associateWithUserGroups(userGroupIds, user, transaction) {
    if (!userGroupIds?.length) return;
    const userGroupData = await user.getAccessibleUserGroups();
    const userAssociatedGroups = userGroupData.filter((it) =>
      userGroupIds.includes(it.id),
    );
    if (!userAssociatedGroups.length) return;
    const UserGroup = this.sequelize.model('UserGroup');
    const userGroups = await UserGroup.findAll({
      where: { id: userAssociatedGroups.map((it) => it.id) },
    });
    await this.setUserGroups(userGroups, { transaction });
  }

  getUser(user) {
    return this.getUsers({ where: { id: user.id } }).then((users) => users[0]);
  }

  // Resolves through `@tailor-cms/config`'s schema API, which sees both
  // bundled schemas and any runtime extras registered via `register()`
  getSchemaConfig() {
    const snapshotConfig = this.data?.$$?.schema?.config;
    if (snapshotConfig) registerSchema(snapshotConfig);
    return getSchema(this.schema);
  }

  /**
   * FILE-type meta on this repository as { metaKey, storageKey } refs - one per
   * file field that holds a value. Empty when the schema can't be resolved.
   */
  getFileMetaInputs() {
    let config;
    try {
      config = this.getSchemaConfig();
    } catch {
      return [];
    }
    return (config.meta ?? []).flatMap((field) => {
      if (field.type !== MetaInputType.File) return [];
      const value = this.data?.[field.key];
      return value?.key ? [{ metaKey: field.key, storageKey: value.key }] : [];
    });
  }
}

export default Repository;
