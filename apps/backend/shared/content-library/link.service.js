import { StatusCodes } from 'http-status-codes';
import { schema } from '@tailor-cms/config';

import { createError } from '#shared/error/helpers.js';

const { getCompatibleTargetType, isOutlineActivity, isTypeAllowedAtLevel } =
  schema;

const { NOT_FOUND, BAD_REQUEST } = StatusCodes;

const UNLINK_DATA = { isLinkedCopy: false, sourceModifiedAt: null };

class LinkService {
  db = null;

  /**
   * Initialize service with db. Called during database boot.
   */
  init(db) {
    this.db = db;
  }

  // ─────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────

  /**
   * Link an activity tree from another repository into the target repository.
   * Handles both same-schema and cross-schema linking with type transformation.
   */
  async linkActivity(sourceId, targetRepository, parentId, position, context) {
    const { Activity, Repository, sequelize } = this.db;
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
      // Auto-unlink parent's linked tree if it's part of a linked hierarchy
      if (parentId) {
        await this.unlinkParentIfLinked(parentId, context, transaction);
      }
      return this.#cloneTree(source, { ...opts, transaction });
    });
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
    const { Activity, sequelize } = this.db;
    const activity = await Activity.findByPk(activityId);
    if (!activity) throw createError(NOT_FOUND, 'Activity not found');
    if (!activity.isLinkedCopy) return activity;
    return sequelize.transaction(async (transaction) => {
      await this.unlinkTree(activity, context, transaction);
      return activity.reload({ transaction });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Hook Support
  // ─────────────────────────────────────────────────────────────────

  /**
   * Check if parent is part of a linked tree and unlink from entry point.
   * Used by activity hooks when structural modifications break the link.
   * @returns {Activity|null} The unlinked entry point, or null if not linked
   */
  async unlinkParentIfLinked(parentId, context, transaction) {
    const { Activity } = this.db;
    const parent = await Activity.findByPk(parentId, { transaction });
    if (!parent?.isLinkedCopy) return null;
    const entryPoint = await parent.findLinkEntryPoint(transaction);
    if (!entryPoint) return null;
    await this.unlinkTree(entryPoint, context, transaction);
    return entryPoint;
  }

  /**
   * Check if activity is part of a linked tree and unlink from entry point.
   * Used by content element hooks when structural modifications break the link.
   * @returns {Activity|null} The unlinked entry point, or null if not linked
   */
  async unlinkActivityIfLinked(activityId, context, transaction) {
    const { Activity } = this.db;
    const activity = await Activity.findByPk(activityId, { transaction });
    if (!activity?.isLinkedCopy) return null;
    const entryPoint = await activity.findLinkEntryPoint(transaction);
    if (!entryPoint) return null;
    await this.unlinkTree(entryPoint, context, transaction);
    return entryPoint;
  }

  /**
   * Unlink all copies when source activity is deleted.
   * Copies become independent (isLinkedCopy: false) but keep sourceId for
   * provenance.
   * @returns {Activity[]} Array of unlinked copies for SSE notification
   */
  async unlinkCopiesOfSource(sourceId, transaction) {
    const { Activity } = this.db;
    const linkedCopies = await Activity.unscoped().findAll({
      where: { sourceId, isLinkedCopy: true },
    });
    if (!linkedCopies.length) return [];
    for (const copy of linkedCopies) {
      await copy.update(UNLINK_DATA, { transaction, hooks: false });
    }
    return linkedCopies;
  }

  /**
   * Auto-detach linked activity when data is edited.
   * "If you edit it, you own it" - user edits break the library link.
   * @returns {boolean} True if activity was detached
   */
  async detachOnEdit(activity, transaction) {
    if (!activity.isLinkedCopy) return false;
    await activity.update(UNLINK_DATA, { transaction, hooks: false });
    return true;
  }

  // ─────────────────────────────────────────────────────────────────
  // Core Operations
  // ─────────────────────────────────────────────────────────────────

  /**
   * Unlink activity tree within a transaction.
   * Exposed for use in hooks when structural changes occur.
   * @param {Activity} activity - Root of tree to unlink
   * @param {Object} context - Context with userId
   * @param {Transaction} transaction - Sequelize transaction
   */
  async unlinkTree(activity, context, transaction) {
    const { Activity, ContentElement } = this.db;
    await activity.update(UNLINK_DATA, { transaction, context, hooks: false });
    // Batch update descendants and elements
    const { nodes } = await activity.descendants({ attributes: ['id'] });
    const activityIds = nodes.map((n) => n.id);
    if (activityIds.length) {
      await Activity.update(UNLINK_DATA, {
        where: { id: activityIds },
        transaction,
      });
    }
    await ContentElement.update(UNLINK_DATA, {
      where: { activityId: [activity.id, ...activityIds] },
      transaction,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────

  /**
   * Recursively clone activity and descendants with type mapping.
   */
  async #cloneTree(source, opts) {
    const { Activity } = this.db;
    const { targetRepository, parentId, position, context, transaction } = opts;
    const targetType = await this.#resolveType(source.type, opts);
    // Mark as libraryUpdate to prevent hooks from auto-unlinking the tree
    const linkContext = { ...context, libraryUpdate: true };
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
      { transaction, context: linkContext },
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
    const { Activity } = this.db;
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
    const { ContentElement } = this.db;
    const { context, transaction } = opts;
    // Mark as libraryUpdate to prevent hooks from auto-unlinking
    const linkContext = { ...context, libraryUpdate: true };
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
        { transaction, context: linkContext },
      );
    }
  }
}

export default new LinkService();
