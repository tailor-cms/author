import { Model, Op } from 'sequelize';
import { ContentElement as Events } from '@tailor-cms/common/src/sse.js';
import forEach from 'lodash/forEach.js';
import isNumber from 'lodash/isNumber.js';
import map from 'lodash/map.js';
import pick from 'lodash/pick.js';
import Promise from 'bluebird';
import zipObject from 'lodash/zipObject.js';
import hooks from './content-element.hooks.ts';
import calculatePosition from '#shared/util/calculatePosition.js';
import {
  detectMissingReferences,
  removeReference,
} from '#shared/util/modelReference.js';
import { createLogger } from '#logger';

const logger = createLogger('content-element:model');

class ContentElement extends Model {
  static fields(DataTypes) {
    const { BOOLEAN, DATE, DOUBLE, INTEGER, JSONB, STRING, UUID, UUIDV4 } =
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
        validate: { min: 0, max: 1000000 },
      },
      contentId: {
        type: UUID,
        field: 'content_id',
        defaultValue: UUIDV4,
      },
      contentSignature: {
        type: STRING(40),
        field: 'content_signature',
        validate: { notEmpty: true },
      },
      data: {
        type: JSONB,
      },
      meta: {
        type: JSONB,
      },
      refs: {
        type: JSONB,
        defaultValue: {},
      },
      // Unreachable within the repository structure because an ancestor
      // activity was deleted, breaking the hierarchy chain. The record itself
      // is intact (deletedAt handles actual soft-delete).
      detached: {
        type: BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      // Indicates this is an active linked copy of a source element.
      // Editing data auto-unlinks, preserving sourceId for provenance.
      isLinkedCopy: {
        type: BOOLEAN,
        field: 'is_linked_copy',
        defaultValue: false,
        allowNull: false,
      },
      // References the source element this was copied from.
      // Kept after unlinking to track provenance. NULL if source is deleted.
      sourceId: {
        type: INTEGER,
        field: 'source_id',
        allowNull: true,
        references: {
          model: 'content_element',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      // Timestamp of source when last synced. Used to detect available updates.
      sourceModifiedAt: {
        type: DATE,
        field: 'source_modified_at',
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

  static associate({ Activity, Repository }) {
    this.belongsTo(Activity, {
      foreignKey: { name: 'activityId', field: 'activity_id' },
    });
    this.belongsTo(Repository, {
      foreignKey: { name: 'repositoryId', field: 'repository_id' },
    });
  }

  static hooks(Hooks, models) {
    hooks.add(this, Hooks, models);
  }

  static scopes() {
    const notEmpty = { [Op.ne]: {} };
    return {
      withReferences: { where: { refs: notEmpty } },
      publish: {
        attributes: [
          'id',
          'uid',
          'type',
          'contentId',
          'contentSignature',
          'position',
          'data',
          'meta',
          'refs',
          'sourceId',
          'isLinkedCopy',
          'createdAt',
          'updatedAt',
        ],
        order: [['position', 'ASC']],
      },
    };
  }

  static options() {
    return {
      modelName: 'ContentElement',
      tableName: 'content_element',
      underscored: true,
      timestamps: true,
      paranoid: true,
    };
  }

  static get Events() {
    return Events;
  }

  static fetch(opt) {
    return isNumber(opt)
      ? ContentElement.findByPk(opt).then(
          (it) => it && hooks.applyFetchHooks(it),
        )
      : ContentElement.findAll(opt).map(hooks.applyFetchHooks);
  }

  static async cloneElements(src, container, options) {
    const { id: activityId, repositoryId } = container;
    const { context, transaction } = options;
    const newElements = await this.bulkCreate(
      src.map((it) => {
        return Object.assign(
          pick(it, [
            'type',
            'position',
            'data',
            'contentId',
            'contentSignature',
            'refs',
            'meta',
            'isLinkedCopy',
            'sourceId',
            'sourceModifiedAt',
          ]),
          { activityId, repositoryId },
        );
      }),
      { returning: true, context, transaction },
    );
    const idMap = zipObject(map(src, 'id'), map(newElements, 'id'));
    const uidMap = zipObject(map(src, 'uid'), map(newElements, 'uid'));
    return { idMap, uidMap };
  }

  static async detectMissingReferences(elements, transaction) {
    const missingReferences = await detectMissingReferences(
      ContentElement,
      elements,
      this.sequelize,
      transaction,
    );
    const Activity = this.sequelize.model('Activity');
    return Promise.each(missingReferences, async (relationship) => {
      const activity = await Activity.findByPk(relationship.src.activityId);
      relationship.src = {
        ...relationship.src.toJSON(),
        outlineActivity: await activity.getFirstOutlineItem(),
      };
      return relationship;
    });
  }

  removeReference(type, id) {
    this.refs = removeReference(this.refs, type, id);
  }

  // Maps references for a cloned element by replacing old ids/uids with new
  // ones from the provided mappings. Each ref carries id, optional uid,
  // outlineId and containerId - all four must resolve through `mappings`
  // or the ref is dropped from the cloned element with an error log.
  mapClonedReferences(mappings, transaction) {
    const { refs } = this;
    // TODO: Refactor this and extract common logic so it can be reused.
    // This logic is copied from transfer processor as import and clone logic
    // should be the same.
    forEach(refs, (values, name) => {
      forEach(values, (ref, index) => {
        const id = mappings.elementId[ref.id];
        const uid = mappings.elementUid[ref.uid];
        const outlineId = mappings.activityId[ref.outlineId];
        const containerId = mappings.activityId[ref.containerId];
        if (!id || (ref.uid && !uid) || !outlineId || !containerId) {
          return logger.error({ ref }, 'Unable to resolve element ref');
        }
        refs[name][index] = {
          id,
          ...(ref.uid && { uid }),
          outlineId,
          containerId,
        };
      });
    });
    this.changed('refs', true);
    return this.save({ transaction });
  }

  siblings(filter = {}) {
    const where = Object.assign({}, filter, { activityId: this.activityId });
    return ContentElement.findAll({ where, order: [['position', 'ASC']] });
  }

  reorder(index) {
    return this.sequelize.transaction((t) => {
      return this.getReorderFilter()
        .then((filter) => this.siblings(filter))
        .then((siblings) => {
          this.position = calculatePosition(this.id, index, siblings);
          return this.save({ transaction: t });
        });
    });
  }

  getReorderFilter() {
    return this.getActivity().then((parent) => {
      if (parent.type !== 'ASSESSMENT_GROUP') return {};
      if (this.type === 'ASSESSMENT') return { type: 'ASSESSMENT' };
      return { type: { [Op.not]: 'ASSESSMENT' } };
    });
  }

  // Loads the source element's display info for a linked copy, returning
  // null when the element is not a linked copy or the source row has been
  // hard-deleted.
  async getSourceInfo() {
    if (!this.sourceId) return null;
    const Repository = this.sequelize.model('Repository');
    const Activity = this.sequelize.model('Activity');
    const source = await ContentElement.findByPk(this.sourceId, {
      include: [
        { model: Repository, attributes: ['id', 'name'] },
        { model: Activity },
      ],
    });
    if (!source) return null;
    const outlineActivity = await source.activity?.getFirstOutlineItem();
    return {
      ...pick(source, ['id', 'uid', 'repositoryId', 'activityId', 'type']),
      repositoryName: source.repository?.name,
      outlineActivityId: outlineActivity?.id,
      outlineActivityName: outlineActivity?.data?.name,
    };
  }

  // Locates active linked copies of this source element across repositories.
  // The "who are my copies?" lookup; returns one row per copy decorated with
  // its repository name and outline-activity pointer for deep-linking.
  async findCopyLocations() {
    const Repository = this.sequelize.model('Repository');
    const Activity = this.sequelize.model('Activity');
    const copies = await ContentElement.findAll({
      where: { sourceId: this.id, isLinkedCopy: true },
      include: [
        { model: Repository, attributes: ['id', 'name'] },
        { model: Activity },
      ],
    });
    return Promise.all(
      copies.map(async (copy) => {
        const outline = await copy.activity?.getFirstOutlineItem();
        return {
          ...pick(copy, ['id', 'uid', 'repositoryId', 'activityId']),
          repositoryName: copy.repository?.name,
          outlineActivityId: outline?.id,
          outlineActivityName: outline?.data?.name,
          linkedAt: copy.createdAt,
        };
      }),
    );
  }
}

export default ContentElement;
