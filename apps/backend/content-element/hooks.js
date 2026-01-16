import forEach from 'lodash/forEach.js';
import get from 'lodash/get.js';
import hash from 'hash-object';
import pick from 'lodash/pick.js';
import Promise from 'bluebird';
import { schema } from '@tailor-cms/config';

import { createLogger } from '#logger';
import elementHooks from '#shared/content-plugins/elementHooks.js';
import PluginRegistry from '#shared/content-plugins/index.js';
import { resolveStatics } from '#shared/storage/helpers.js';
import sse from '#shared/sse/index.js';

const { elementRegistry } = PluginRegistry;
const logger = createLogger('content-element:hooks');
const log = (msg) => logger.debug(msg.replace(/\n/g, ' '));

// Shared options for library sync operations (prevents hook recursion)
const SYNC_OPTS = { context: { libraryUpdate: true }, hooks: false };

function add(ContentElement, Hooks, Models) {
  const { Activity, Comment, Repository } = Models;
  const { Events } = ContentElement;
  const isRepository = (it) => it instanceof Repository;
  const isLibrarySync = (opts) => opts.context?.libraryUpdate;
  const broadcast = (repoId, event, payload) =>
    sse.channel(repoId).send(event, payload);

  const findLinkedElements = (sourceId) =>
    ContentElement.findAll({ where: { sourceId, isLinkedCopy: true } });

  const findLinkedActivities = (sourceId) =>
    Activity.findAll({ where: { sourceId, isLinkedCopy: true } });

  /**
   * Auto-detach linked element when user edits data.
   * "If you edit it, you own it" - user edits break the library link.
   */
  async function autoDetachOnEdit(_hookType, element, opts) {
    if (!element.isLinkedCopy) return;
    if (!opts.fields?.includes('data')) return;
    if (isLibrarySync(opts)) return;
    await element.update(
      { isLinkedCopy: false, sourceModifiedAt: null },
      { transaction: opts.transaction, hooks: false },
    );
  }

  /**
   * Propagate source element updates to all linked copies.
   * Check both current and previous isLinkedCopy - autoDetachOnEdit may have
   * already cleared the flag if user edited a linked copy.
   */
  async function propagateToLinkedElements(_hookType, element, opts) {
    const isOrWasLinkedCopy =
      element.isLinkedCopy || element.previous('isLinkedCopy');
    if (isLibrarySync(opts) || isOrWasLinkedCopy) return;
    const linkedElements = await findLinkedElements(element.id);
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
      broadcast(linked.repositoryId, Events.Update, linked);
    }
  }

  /**
   * Propagate new element creation to all linked copies of the parent activity.
   */
  async function propagateElementCreation(_hookType, element, opts) {
    if (isLibrarySync(opts) || element.isLinkedCopy) return;
    const linkedActivities = await findLinkedActivities(element.activityId);
    if (linkedActivities.length) {
      log(
        `Propagating element ${element.id} creation
        to ${linkedActivities.length} linked activities`,
      );
    }
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
      broadcast(linkedActivity.repositoryId, Events.Create, newElement);
    }
  }

  /**
   * Propagate source element deletion to all linked copies.
   */
  async function propagateElementDeletion(_hookType, element, opts) {
    if (isLibrarySync(opts) || element.isLinkedCopy) return;
    const linkedElements = await findLinkedElements(element.id);
    if (linkedElements.length) {
      log(
        `Propagating element ${element.id} deletion
        to ${linkedElements.length} linked elements`,
      );
    }
    for (const linked of linkedElements) {
      await linked.destroy(SYNC_OPTS);
      broadcast(linked.repositoryId, Events.Delete, linked);
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
      customElementHook,
      resolveAssets,
      propagateElementCreation,
      sseCreate,
      touchRepository,
      touchOutline,
    ],
    [Hooks.afterUpdate]: [
      autoDetachOnEdit,
      customElementHook,
      resolveAssets,
      propagateToLinkedElements,
      sseUpdate,
      touchRepository,
      touchOutline,
    ],
    [Hooks.beforeDestroy]: [touchRepository, touchOutline],
    [Hooks.afterDestroy]: [propagateElementDeletion, sseDelete],
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
