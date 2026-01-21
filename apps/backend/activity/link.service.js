import { StatusCodes } from 'http-status-codes';
import { schema } from '@tailor-cms/config';

import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';

const { Activity, ContentElement, Repository, sequelize } = db;
const { getCompatibleTargetType, isOutlineActivity, isTypeAllowedAtLevel } =
  schema;

const { NOT_FOUND, BAD_REQUEST } = StatusCodes;

class LinkService {
  /**
   * Link an activity tree from another repository into the target repository.
   * Handles both same-schema and cross-schema linking with type transformation.
   */
  async linkActivity(sourceId, targetRepository, parentId, position, context) {
    const source = await Activity.findByPk(sourceId, { include: [Repository] });
    if (!source) throw createError(NOT_FOUND, 'Source activity not found');
    const opts = {
      targetRepository,
      parentId,
      position,
      isSameSchema: source.repository.schema === targetRepository.schema,
      context,
    };
    return sequelize.transaction(async (transaction) => {
      // Auto-unlink parent if it's a linked activity
      // adding children modifies it
      if (parentId) {
        const parent = await Activity.findByPk(parentId, { transaction });
        if (parent?.isLinkedCopy) {
          await this.#unlinkTree(parent, context, transaction);
        }
      }
      return this.#cloneTree(source, { ...opts, transaction });
    });
  }

  /**
   * Recursively clone activity and descendants with type mapping.
   */
  async #cloneTree(source, opts) {
    const { targetRepository, parentId, position, context, transaction } = opts;
    const targetType = await this.#resolveType(source.type, opts);
    const linked = await Activity.create(
      {
        repositoryId: targetRepository.id,
        parentId,
        position,
        type: targetType,
        data: { ...source.data },
        refs: {},
        isLinkedCopy: true,
        sourceId: source.id,
        sourceModifiedAt: source.modifiedAt || source.updatedAt,
      },
      { transaction, context },
    );
    await this.#cloneElements(source.id, linked, opts);
    const children = await source.getChildren({
      where: { detached: false },
      order: [['position', 'ASC']],
      transaction,
    });
    const results = [linked];
    for (const child of children) {
      const childOpts = {
        ...opts,
        parentId: linked.id,
        position: child.position,
      };
      results.push(...(await this.#cloneTree(child, childOpts)));
    }
    return results;
  }

  /**
   * Resolve target type, validates for same-schema, transforms for cross-schema.
   */
  async #resolveType(srcType, opts) {
    // Containers aren't in outline hierarchy - keep same type
    if (!isOutlineActivity(srcType)) return srcType;
    const { targetRepository, parentId, isSameSchema, transaction } = opts;
    const parentType = parentId
      ? (await Activity.findByPk(parentId, { transaction }))?.type
      : null;
    if (isSameSchema) {
      if (!isTypeAllowedAtLevel(srcType, targetRepository.schema, parentType)) {
        throw createError(BAD_REQUEST, `Type ${srcType} not allowed here`);
      }
      return srcType;
    }
    const targetType = getCompatibleTargetType(
      srcType,
      targetRepository.schema,
      parentType,
    );
    if (!targetType) {
      throw createError(BAD_REQUEST, `No compatible type for ${srcType}`);
    }
    return targetType;
  }

  /**
   * Clone content elements from source to linked activity.
   */
  async #cloneElements(sourceActivityId, targetActivity, opts) {
    const { context, transaction } = opts;
    const elements = await ContentElement.findAll({
      where: { activityId: sourceActivityId, detached: false },
      transaction,
    });
    for (const el of elements) {
      await ContentElement.create(
        {
          repositoryId: targetActivity.repositoryId,
          activityId: targetActivity.id,
          type: el.type,
          position: el.position,
          data: { ...el.data },
          meta: { ...el.meta },
          refs: {},
          isLinkedCopy: true,
          sourceId: el.id,
          sourceModifiedAt: el.updatedAt,
        },
        { transaction, context },
      );
    }
  }

  /**
   * Unlink/detach an activity from its source.
   * Converts linked copy to independent local copy.
   * Keeps sourceId for provenance but stops auto-sync updates.
   *
   * @param {number} activityId - ID of the activity to unlink
   * @param {Object} context - Context with userId for hooks
   * @returns {Promise<Activity>} The unlinked activity
   */
  async unlinkActivity(activityId, context) {
    const activity = await Activity.findByPk(activityId);
    if (!activity) throw createError(NOT_FOUND, 'Activity not found');
    if (!activity.isLinkedCopy) return activity;
    return sequelize.transaction(async (transaction) => {
      await this.#unlinkTree(activity, context, transaction);
      return activity.reload({ transaction });
    });
  }

  /**
   * Unlink activity tree within a transaction.
   * @private
   */
  async #unlinkTree(activity, context, transaction) {
    const unlinkData = { isLinkedCopy: false, sourceModifiedAt: null };
    // Update root with context (triggers hooks for SSE)
    await activity.update(unlinkData, { transaction, context });
    // Batch update descendants and elements
    const { nodes } = await activity.descendants({ attributes: ['id'] });
    const activityIds = nodes.map((n) => n.id);
    if (activityIds.length) {
      await Activity.update(unlinkData, {
        where: { id: activityIds },
        transaction,
      });
    }
    await ContentElement.update(unlinkData, {
      where: { activityId: [activity.id, ...activityIds] },
      transaction,
    });
  }
}

export default new LinkService();
