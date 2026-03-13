import { Activity as ActivityEvents } from '@tailor-cms/common/src/sse.js';
import forEach from 'lodash/forEach.js';
import get from 'lodash/get.js';
import hash from 'hash-object';
import pick from 'lodash/pick.js';
import Promise from 'bluebird';
import { schema } from '@tailor-cms/config';

import { createLogger } from '#logger';
import elementHooks from '#shared/content-plugins/elementHooks.js';
import linkService from '#shared/content-library/link.service.js';
import PluginRegistry from '#shared/content-plugins/index.js';
import { resolveStatics } from '#shared/storage/helpers.js';
import sse from '#shared/sse/index.js';

const { elementRegistry } = PluginRegistry;

const logger = createLogger('content-element:hooks');
const log = (msg) => logger.debug(msg.replace(/\n/g, ' '));

// Shared options for link sync operations (prevents hook recursion)
const SYNC_OPTS = { context: { linkSync: true }, hooks: false };

function add(ContentElement, Hooks, Models) {
  const { Activity, Comment, Repository } = Models;
  const { Events } = ContentElement;
  const isRepository = (it) => it instanceof Repository;
  const isLinkSync = (opts) => opts.context?.linkSync;
  const broadcast = (repoId, event, payload) =>
    sse.channel(repoId).send(event, payload);

  const findLinkedElements = (sourceId) =>
    ContentElement.findAll({ where: { sourceId, isLinkedCopy: true } });

  const findLinkedActivities = (sourceId) =>
    Activity.findAll({ where: { sourceId, isLinkedCopy: true } });

  // Resolve unique outline activities for a list of elements
  const resolveOutlineActivities = async (elements) => {
    const activityIds = [...new Set(elements.map((el) => el.activityId))];
    const activities = await Activity.findAll({
      where: { id: activityIds },
      paranoid: true,
    });
    const result = new Map();
    await Promise.all(
      activities.map(async (activity) => {
        const outline = schema.isOutlineActivity(activity.type)
          ? activity
          : await activity.getOutlineParent();
        if (outline) result.set(outline.id, outline);
      }),
    );
    return [...result.values()];
  };

  // Mark repositories and outline activities as having unpublished changes
  // after library sync propagation. Accepts pre-resolved outline activities
  // (needed for deletion where elements are destroyed before touching).
  const markLinkedAsChanged = async (
    repoIds,
    elements = [],
    outlineActivities,
  ) => {
    if (!repoIds.size) return;
    await Repository.update(
      { hasUnpublishedChanges: true },
      { where: { id: [...repoIds] } },
    );
    // Touch outline activities so per-item publish status reflects the change
    if (!outlineActivities)
      outlineActivities = await resolveOutlineActivities(elements);
    for (const activity of outlineActivities) {
      await activity.touch();
    }
  };

  /**
   * Auto-unlink linked element when user edits data.
   * "If you edit it, you own it" - user edits break the library link.
   * Also unlinks the parent activity tree if the element is part of one.
   */
  async function autoUnlinkOnEdit(_hookType, element, opts) {
    if (!element.isLinkedCopy) return;
    if (!opts.fields?.includes('data')) return;
    if (isLinkSync(opts)) return;
    await element.update(
      { isLinkedCopy: false, sourceModifiedAt: null },
      { transaction: opts.transaction, hooks: false },
    );
    // Also unlink the parent activity tree if it's part of a linked hierarchy
    const entryPoint = await linkService.unlinkActivityIfLinked(
      element.activityId,
      opts.context,
      opts.transaction,
    );
    if (entryPoint) {
      broadcast(entryPoint.repositoryId, ActivityEvents.Update, entryPoint);
    }
  }

  /**
   * Propagate source element updates to all linked copies.
   * Skipped when:
   * - linkSync: update originated from the sync system itself (prevents loops)
   * - isOrWasLinkedCopy: element is a copy, not a source - only sources
   *   propagate. Checks previous('isLinkedCopy') to catch the case where
   *   autoUnlinkOnEdit cleared the flag in the same update cycle.
   */
  async function propagateToLinkedElements(_hookType, element, opts) {
    const isOrWasLinkedCopy =
      element.isLinkedCopy || element.previous('isLinkedCopy');
    if (isLinkSync(opts) || isOrWasLinkedCopy) return;
    const linkedElements = await findLinkedElements(element.id);
    if (!linkedElements.length) return;
    const affectedRepoIds = new Set();
    for (const linked of linkedElements) {
      await linked.update(
        {
          data: element.data,
          meta: element.meta,
          position: element.position,
          sourceModifiedAt: element.updatedAt,
        },
        SYNC_OPTS,
      );
      await resolveStatics(linked);
      affectedRepoIds.add(linked.repositoryId);
      broadcast(linked.repositoryId, Events.Update, linked);
    }
    await markLinkedAsChanged(affectedRepoIds, linkedElements);
  }

  /**
   * Propagate new element creation to all linked copies of the parent activity.
   * Skipped when:
   * - linkSync: creation originated from the sync system itself (prevents loops)
   * - isLinkedCopy: element was created as a copy, not as a new source element
   */
  async function propagateElementCreation(_hookType, element, opts) {
    if (isLinkSync(opts) || element.isLinkedCopy) return;
    const linkedActivities = await findLinkedActivities(element.activityId);
    if (!linkedActivities.length) return;
    log(
      `Propagating element ${element.id} creation
      to ${linkedActivities.length} linked activities`,
    );
    const affectedRepoIds = new Set();
    const createdElements = [];
    for (const linkedActivity of linkedActivities) {
      const newElement = await ContentElement.create(
        {
          ...pick(element, ['type', 'data', 'meta', 'position', 'contentId']),
          repositoryId: linkedActivity.repositoryId,
          activityId: linkedActivity.id,
          refs: {},
          isLinkedCopy: true,
          sourceId: element.id,
          sourceModifiedAt: element.updatedAt,
        },
        SYNC_OPTS,
      );
      await resolveStatics(newElement);
      createdElements.push(newElement);
      affectedRepoIds.add(linkedActivity.repositoryId);
      broadcast(linkedActivity.repositoryId, Events.Create, newElement);
    }
    await markLinkedAsChanged(affectedRepoIds, createdElements);
  }

  /**
   * Propagate source element deletion to all linked copies.
   * Skipped when:
   * - linkSync: deletion originated from the sync system itself (prevents loops)
   * - isLinkedCopy: a copy was deleted, not the source
   */
  async function propagateElementDeletion(_hookType, element, opts) {
    if (isLinkSync(opts) || element.isLinkedCopy) return;
    const linkedElements = await findLinkedElements(element.id);
    if (!linkedElements.length) return;
    log(
      `Propagating element ${element.id} deletion
      to ${linkedElements.length} linked elements`,
    );
    const affectedRepoIds = new Set();
    // Resolve outline activities before destroying elements
    const outlineActivities = await resolveOutlineActivities(linkedElements);
    for (const linked of linkedElements) {
      await linked.destroy(SYNC_OPTS);
      affectedRepoIds.add(linked.repositoryId);
      broadcast(linked.repositoryId, Events.Delete, linked);
    }
    await markLinkedAsChanged(affectedRepoIds, [], outlineActivities);
  }

  /** Unlink activity tree when element created on linked activity. */
  async function unlinkActivityOnCreate(_hookType, element, opts) {
    if (isLinkSync(opts)) return;
    if (!element.activityId) return;
    log('Checking activity unlink due to element creation');
    const entryPoint = await linkService.unlinkActivityIfLinked(
      element.activityId,
      opts.context,
      opts.transaction,
    );
    if (entryPoint) {
      broadcast(entryPoint.repositoryId, ActivityEvents.Update, entryPoint);
    }
  }

  /** Unlink activity tree when element deleted from linked activity. */
  async function unlinkActivityOnDelete(_hookType, element, opts) {
    if (isLinkSync(opts)) return;
    if (!element.activityId) return;
    log('Checking activity unlink due to element deletion');
    const entryPoint = await linkService.unlinkActivityIfLinked(
      element.activityId,
      opts.context,
      opts.transaction,
    );
    if (entryPoint) {
      broadcast(entryPoint.repositoryId, ActivityEvents.Update, entryPoint);
    }
  }

  const elementHookMappings = {
    [Hooks.beforeCreate]: [elementHooks.BEFORE_SAVE],
    [Hooks.beforeUpdate]: [elementHooks.BEFORE_SAVE],
    [Hooks.afterCreate]: [elementHooks.AFTER_SAVE, elementHooks.AFTER_LOADED],
    [Hooks.afterUpdate]: [elementHooks.AFTER_SAVE, elementHooks.AFTER_LOADED],
  };

  function customElementHook(hookType, element, options) {
    const elementHookTypes = elementHookMappings[hookType];
    if (!elementHookTypes) return;
    return Promise.resolve(elementHookTypes)
      .map((hook) => elementRegistry.getHook(element.type, hook))
      .filter(Boolean)
      .reduce((result, hook) => hook(result, options), element);
  }

  function processAssets(hookType, element) {
    // pruneVirtualProps
    // data.assets is an obj containing asset urls where key represents location
    // within data (where it should be resolved). If asset is internal
    // it will have storage:// protocol set.
    const assets = get(element, 'data.assets', {});
    forEach(assets, (key) => delete element.data[key]);
    const isUpdate = hookType === Hooks.beforeUpdate;
    if (isUpdate && !element.changed('data')) return Promise.resolve();
    element.contentSignature = hash(element.data, { algorithm: 'sha1' });
    return element;
  }

  function resolveAssets(_, element) {
    return resolveStatics(element);
  }

  function touchRepository(_, _element, { context = {} }) {
    if (!isRepository(context.repository)) return Promise.resolve();
    return context.repository.update({ hasUnpublishedChanges: true });
  }

  async function touchOutline(_, element, { context = {} }) {
    if (!isRepository(context.repository)) return Promise.resolve();
    const activity = await resolveOutlineActivity(element);
    return activity?.touch();
  }

  function sseCreate(_, element) {
    broadcast(element.repositoryId, Events.Create, element);
  }

  function sseUpdate(hookType, element) {
    const wasDetached =
      element.previous('detached') === false && element.detached;
    if (wasDetached) return sseDelete(hookType, element);
    broadcast(element.repositoryId, Events.Update, element);
  }

  async function sseDelete(_, element) {
    await element.reload({ paranoid: false });
    broadcast(element.repositoryId, Events.Delete, element);
    return Comment.update(
      { activityId: null },
      {
        where: { contentElementId: element.id },
        returning: true,
        paranoid: false,
      },
    );
  }

  const mappings = {
    [Hooks.beforeCreate]: [customElementHook, processAssets],
    [Hooks.beforeUpdate]: [customElementHook, processAssets],
    [Hooks.afterCreate]: [
      unlinkActivityOnCreate,
      customElementHook,
      resolveAssets,
      propagateElementCreation,
      sseCreate,
      touchRepository,
      touchOutline,
    ],
    [Hooks.afterUpdate]: [
      autoUnlinkOnEdit,
      customElementHook,
      resolveAssets,
      propagateToLinkedElements,
      sseUpdate,
      touchRepository,
      touchOutline,
    ],
    [Hooks.beforeDestroy]: [touchRepository, touchOutline],
    [Hooks.afterDestroy]: [
      unlinkActivityOnDelete,
      propagateElementDeletion,
      sseDelete,
    ],
  };

  forEach(mappings, (hooks, type) => {
    forEach(hooks, (hook) => {
      ContentElement.addHook(type, Hooks.withType(type, hook));
    });
  });
}

function applyFetchHooks(element) {
  const { AFTER_RETRIEVE, AFTER_LOADED } = elementHooks;
  const hooks = [AFTER_RETRIEVE, AFTER_LOADED]
    .map((hook) => elementRegistry.getHook(element.type, hook))
    .filter(Boolean);
  return Promise.reduce(
    [...hooks, resolveStatics],
    (el, hook) => hook(el),
    element,
  );
}

function resolveOutlineActivity(element) {
  return element.getActivity({ paranoid: true }).then((activity) => {
    if (!activity) return;
    return schema.isOutlineActivity(activity.type)
      ? activity
      : activity.getOutlineParent();
  });
}

export { add, applyFetchHooks };

export default { add, applyFetchHooks };
