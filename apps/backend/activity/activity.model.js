import { Model, Op } from 'sequelize';
import { schema, workflow } from '@tailor-cms/config';
import { Activity as Events } from '@tailor-cms/common/src/sse.js';
import isEmpty from 'lodash/isEmpty.js';
import map from 'lodash/map.js';
import pick from 'lodash/pick.js';
import Promise from 'bluebird';
import hooks from './hooks.js';
import calculatePosition from '#shared/util/calculatePosition.js';
import {
  detectMissingReferences,
  removeReference,
} from '#shared/util/modelReference.js';

const { getSiblingTypes, isOutlineActivity, isTrackedInWorkflow } = schema;
const { getDefaultActivityStatus } = workflow;

class Activity extends Model {
  static fields(DataTypes) {
    const { STRING, DOUBLE, JSONB, BOOLEAN, DATE, UUID, UUIDV4, VIRTUAL } =
      DataTypes;
    return {
      uid: {
        type: UUID,
        unique: true,
        defaultValue: UUIDV4,
      },
      type: {
        type: STRING,
      },
      position: {
        type: DOUBLE,
        allowNull: false,
        validate: { min: 0 },
      },
      data: {
        type: JSONB,
      },
      refs: {
        type: JSONB,
        defaultValue: {},
      },
      // Soft-delete flag for cascade deletion. When parent is deleted,
      // descendants are marked detached, allowing restore operations.
      // Hidden from normal queries until parent is restored or changes published.
      detached: {
        type: BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isTrackedInWorkflow: {
        type: VIRTUAL,
        get() {
          const type = this.get('type');
          return type && isTrackedInWorkflow(type);
        },
      },
      // Indicates this is an active linked copy from a library source.
      // When true, receives automatic updates when source changes.
      // Editing data auto-detaches (sets to false), preserving sourceId for
      // provenance.
      isLinkedCopy: {
        type: BOOLEAN,
        field: 'is_linked_copy',
        defaultValue: false,
        allowNull: false,
      },
      // References the source activity this was copied from.
      // Kept after unlinking to track provenance. NULL if source is deleted.
      sourceId: {
        type: DataTypes.INTEGER,
        field: 'source_id',
        allowNull: true,
        references: {
          model: 'activity',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      // Timestamp of source when last synced. Used to detect available updates.
      // Cleared when the link is broken.
      sourceModifiedAt: {
        type: DATE,
        field: 'source_modified_at',
        allowNull: true,
      },
      // Aggregated timestamp representing when anything in the subtree last
      // changed. Bubbles up from content tree descendants.
      modifiedAt: {
        type: DATE,
        field: 'modified_at',
      },
      publishedAt: {
        type: DATE,
        field: 'published_at',
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

  /**
   * Get source activity info for linked copy.
   */
  async getSourceInfo() {
    if (!this.sourceId) return null;
    const Repository = this.sequelize.model('Repository');
    const source = await Activity.findByPk(this.sourceId, {
      include: [{ model: Repository }],
    });
    if (!source) return null;
    return {
      id: source.id,
      uid: source.uid,
      name: source.data?.name,
      repositoryId: source.repositoryId,
      repositoryName: source.repository?.name,
    };
  }

  /**
   * Find where this source activity is being used (as linked copies).
   * When a hierarchy is linked, all descendants also become linked copies.
   * This method returns only independent link entry points by excluding
   * copies whose parent is also linked (those came along as part of a parent
   * link). Single-level parent check suffices since linking marks ALL
   * descendants - there can't be a gap in the chain.
   */
  async findCopyLocations() {
    const Repository = this.sequelize.model('Repository');
    const copies = await Activity.findAll({
      where: { sourceId: this.id, isLinkedCopy: true },
      include: [{ model: Repository, attributes: ['id', 'name'] }],
    });
    if (!copies.length) return [];
    // Collect IDs of parents that are themselves linked (single batch query)
    const parentIds = [...new Set(copies.map((c) => c.parentId).filter(Boolean))];
    const linkedParentIds = new Set(
      parentIds.length
        ? (
            await Activity.findAll({
              where: { id: parentIds, isLinkedCopy: true },
              attributes: ['id'],
            })
          ).map((p) => p.id)
        : [],
    );
    // Entry point = not nested within another linked copy
    const isEntryPoint = (copy) => !linkedParentIds.has(copy.parentId);
    return Promise.all(
      copies.filter(isEntryPoint).map(async (copy) => {
        const outline = await copy.getFirstOutlineItem();
        return {
          ...pick(copy, ['id', 'uid', 'repositoryId']),
          outlineActivityId: outline?.id,
          name: copy.data?.name,
          repositoryName: copy.repository?.name,
        };
      }),
    );
  }

  static async create(data, opts) {
    return this.sequelize.transaction(
      { transaction: opts.transaction },
      async (transaction) => {
        const activity = await super.create(data, { ...opts, transaction });
        if (activity.isTrackedInWorkflow) {
          const defaultStatus = getDefaultActivityStatus(activity.type);
          await activity.createStatus(defaultStatus, { transaction });
        }
        return activity;
      },
    );
  }

  static async bulkCreate(data, opts) {
    return this.sequelize.transaction(
      { transaction: opts.transaction },
      async (transaction) => {
        const activities = await super.bulkCreate(data, {
          ...opts,
          transaction,
        });
        const statusData = activities
          .filter((it) => it.isTrackedInWorkflow)
          .map(getDefaultStatus);
        const ActivityStatus = this.sequelize.model('ActivityStatus');
        await ActivityStatus.bulkCreate(statusData, { transaction });
        return activities;
      },
    );
  }

  static associate({ ActivityStatus, ContentElement, Comment, Repository }) {
    this.hasMany(ContentElement, {
      foreignKey: { name: 'activityId', field: 'activity_id' },
    });
    this.hasMany(Comment, {
      foreignKey: { name: 'activityId', field: 'activity_id' },
    });
    this.belongsTo(Repository, {
      foreignKey: { name: 'repositoryId', field: 'repository_id' },
    });
    this.belongsTo(this, {
      as: 'parent',
      foreignKey: { name: 'parentId', field: 'parent_id' },
    });
    this.hasMany(this, {
      as: 'children',
      foreignKey: { name: 'parentId', field: 'parent_id' },
    });
    this.hasMany(ActivityStatus, {
      as: 'status',
      foreignKey: { name: 'activityId', field: 'activity_id' },
    });
  }

  static hooks(Hooks, models) {
    hooks.add(this, Hooks, models);
  }

  static scopes({ ActivityStatus }) {
    const notNull = { [Op.ne]: null };
    return {
      defaultScope: {
        include: [{ model: ActivityStatus, as: 'status' }],
      },
      withReferences(relationships = []) {
        const or = relationships.map((type) => ({ [`refs.${type}`]: notNull }));
        return { where: { [Op.or]: or } };
      },
    };
  }

  static options() {
    return {
      modelName: 'activity',
      underscored: true,
      timestamps: true,
      paranoid: true,
      freezeTableName: true,
    };
  }

  static get Events() {
    return Events;
  }

  static async cloneActivities(src, dstRepositoryId, dstParentId, opts) {
    if (!opts.idMappings)
      opts.idMappings = { activityId: {}, elementId: {}, elementUid: {} };
    const { idMappings, context, transaction } = opts;
    const dstActivities = await Activity.bulkCreate(
      map(src, (it) => ({
        repositoryId: dstRepositoryId,
        parentId: dstParentId,
        ...pick(it, ['type', 'position', 'data', 'refs', 'modifiedAt']),
      })),
      { returning: true, context, transaction },
    );
    const ContentElement = this.sequelize.model('ContentElement');
    return Promise.reduce(
      src,
      async (acc, it, index) => {
        const parent = dstActivities[index];
        acc.activityId[it.id] = parent.id;
        const where = { activityId: it.id, detached: false };
        const elements = await ContentElement.findAll({ where, transaction });
        const { idMap, uidMap } = await ContentElement.cloneElements(
          elements,
          parent,
          { context, transaction },
        );
        Object.assign(acc.elementId, idMap);
        Object.assign(acc.elementUid, uidMap);
        const children = await it.getChildren({ where: { detached: false } });
        if (!children.length) return acc;
        return Activity.cloneActivities(
          children,
          dstRepositoryId,
          parent.id,
          opts,
        );
      },
      idMappings,
    );
  }

  clone(repositoryId, parentId, position, context) {
    return this.sequelize.transaction((transaction) => {
      if (position) this.position = position;
      return Activity.cloneActivities([this], repositoryId, parentId, {
        context,
        transaction,
      });
    });
  }

  /**
   * Maps references for cloned activity.
   * @param {Object} mappings Dict where keys represent old and values new ids.
   * @param {SequelizeTransaction} [transaction]
   * @returns {Promise.<Activity>} Updated instance.
   */
  mapClonedReferences(mappings, relationships, transaction) {
    const refs = this.refs || {};
    relationships.forEach((type) => {
      if (refs[type]) refs[type] = refs[type].map((it) => mappings[it]);
    });
    return this.update({ refs }, { transaction });
  }

  static detectMissingReferences(activities, transaction) {
    return detectMissingReferences(
      Activity,
      activities,
      this.sequelize,
      transaction,
    );
  }

  removeReference(type, id) {
    this.refs = removeReference(this.refs, type, id);
  }

  siblings({ filter = {}, transaction }) {
    const { parentId, repositoryId } = this;
    const where = { ...filter, parentId, repositoryId };
    const options = { where, order: [['position', 'ASC']], transaction };
    return Activity.findAll(options);
  }

  predecessors() {
    if (!this.parentId) return Promise.resolve([]);
    return this.getParent({ paranoid: false }).then((parent) => {
      if (parent.deletedAt) return Promise.resolve([]);
      return parent.predecessors().then((acc) => acc.concat(parent));
    });
  }

  /**
   * Iterates through the parent chain until it finds the first outline
   * Activity. Outline Activities are the ones that are defined in the schema
   * as the structure of the repository.
   * @param {Activity} item
   * @returns {Promise.<Activity>}
   */
  async getFirstOutlineItem(item = this) {
    if (!item.parentId) return item;
    if (isOutlineActivity(item.type)) return item;
    const parent = await item.getParent({ paranoid: false });
    return this.getFirstOutlineItem(parent);
  }

  descendants(options = {}, nodes = [], leaves = []) {
    const { attributes } = options;
    const node = !isEmpty(attributes) ? pick(this, attributes) : this;
    nodes.push(node);
    return Promise.resolve(this.getChildren(options))
      .map((it) => it.descendants(options, nodes, leaves))
      .then((children) => {
        if (!isEmpty(children)) return { nodes, leaves };
        const leaf = !isEmpty(attributes) ? pick(this, attributes) : this;
        leaves.push(leaf);
        return { nodes, leaves };
      });
  }

  remove(options = {}) {
    if (!options.recursive) return this.destroy(options);
    const { soft } = options;
    return this.sequelize.transaction((transaction) => {
      return this.descendants({ attributes: ['id'] })
        .then((descendants) => {
          descendants.all = [...descendants.nodes, ...descendants.leaves];
          return descendants;
        })
        .then((descendants) => {
          const ContentElement = this.sequelize.model('ContentElement');
          const activities = map(descendants.all, 'id');
          const where = { activityId: [...activities, this.id] };
          return removeAll(ContentElement, where, { soft, transaction }).then(
            () => descendants,
          );
        })
        .then((descendants) => {
          const activities = map(descendants.nodes, 'id');
          const where = { parentId: [...activities, this.id] };
          return removeAll(Activity, where, { soft, transaction });
        })
        .then(() => this.destroy({ ...options, transaction }))
        .then(() => this);
    });
  }

  async restoreWithDescendants({ context }) {
    const transaction = await this.sequelize.transaction();
    await this.descendants({ attributes: ['id'] })
      .then((descendants) => {
        descendants.all = [...descendants.nodes, ...descendants.leaves];
        return descendants;
      })
      .then(async (descendants) => {
        const activities = map(descendants.all, 'id');
        const where = { activityId: [...activities, this.id] };
        await this.sequelize
          .model('ContentElement')
          .update({ detached: false }, { where, transaction });
        return descendants;
      })
      .then((descendants) => {
        const activities = map(descendants.nodes, 'id');
        const where = { parentId: [...activities, this.id] };
        return Activity.update({ detached: false }, { where, transaction });
      })
      .then(() => this.restore({ context, transaction }));
    await transaction.commit();
  }

  reorder(index, context) {
    return this.sequelize.transaction((transaction) => {
      const filter = { type: getSiblingTypes(this.type) };
      return this.siblings({ filter, transaction }).then((siblings) => {
        this.position = calculatePosition(this.id, index, siblings);
        return this.save({ transaction, context });
      });
    });
  }

  getOutlineParent(transaction) {
    return this.getParent({ transaction }).then((parent) => {
      if (!parent) return Promise.resolve();
      if (isOutlineActivity(parent.type)) return parent;
      return parent.getOutlineParent(transaction);
    });
  }

  touch(transaction) {
    return this.update({ modifiedAt: new Date() }, { transaction });
  }
}

function removeAll(Model, where = {}, options = {}) {
  const { soft, transaction } = options;
  if (!soft) return Model.destroy({ where });
  return Model.update({ detached: true }, { where, transaction });
}

function getDefaultStatus({ id, type }) {
  const defaultStatus = getDefaultActivityStatus(type);
  return { ...defaultStatus, activityId: id };
}

export default Activity;
