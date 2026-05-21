// ContentElement lifecycle hooks: SSE broadcasts, linked-content
// propagation (sync to copies, auto-unlink on edit), asset processing,
// repository / outline activity touch-up, and per-element plugin hooks
// (beforeSave / afterSave / afterLoaded / afterRetrieve).
// `applyFetchHooks` is invoked manually by `ContentElement.fetch`,
// `Revision.applyFetchHooks`, and the publishing layer.
import type { Transaction } from 'sequelize';
import { Activity as ActivityEvents } from '@tailor-cms/common/src/sse.js';
import forEach from 'lodash/forEach.js';
import hash from 'hash-object';
import omit from 'lodash/omit.js';
import pick from 'lodash/pick.js';
import { schema } from '@tailor-cms/config';

import { createLogger } from '#logger';
import elementHooks from '#shared/content-plugins/elementHooks.js';
import linkService from '#shared/content-library/link.service.js';
import PluginRegistry from '#shared/content-plugins/index.js';
import { resolveStatics } from '#shared/storage/helpers.js';
import sse from '#shared/sse/index.js';
import type { OperationContext } from '#shared/database/types.ts';
import type ActivityModel from '../../activity/models/activity.model.js';
import type { Activity } from '../../activity/models/activity.model.js';
import type CommentModel from '../../comment/models/comment.model.js';
import type RepositoryModel from '../../repository/models/repository.model.js';
import type { Repository } from '../../repository/models/repository.model.js';
import type ContentElementModelDefault from './content-element.model.js';
import type { ContentElement } from './content-element.model.js';

const { elementRegistry } = PluginRegistry;

const logger = createLogger('content-element:hooks');
const log = (msg: string) => logger.debug(msg.replace(/\n/g, ' '));

// Shared options for link sync operations (prevents hook recursion).
const SYNC_OPTS = { context: { linkSync: true }, hooks: false } as const;

// Narrowed slices of the full Sequelize hook-options bag.
type CtxOpts = { context?: OperationContext; transaction?: Transaction };
type UpdateOpts = CtxOpts & { fields?: string[] };

// Element-hook function shape produced by `elementRegistry.getHook`.
type PluginHook = (
  element: ContentElement,
  options?: CtxOpts,
) => ContentElement | Promise<ContentElement>;

// `data.assets` is a `{ <virtual data key>: <storage URL> }` map. The
// authoring runtime fills resolved URLs at the virtual keys for display;
// before persisting we prune those virtual keys back out so only the
// `assets` map travels to the DB.
type AssetsMap = Record<string, unknown>;

interface ModelsBag {
  Repository: typeof RepositoryModel;
  Comment: typeof CommentModel;
  Activity: typeof ActivityModel;
}

function add(
  ContentElement: typeof ContentElementModelDefault,
  Hooks: any,
  Models: ModelsBag,
) {
  const { Activity, Comment, Repository } = Models;
  const { Events } = ContentElement as unknown as {
    Events: {
      Create: string;
      Update: string;
      BulkUpdate: string;
      Delete: string;
    };
  };

  const isRepository = (it: unknown): it is Repository =>
    it instanceof Repository;

  const isLinkSync = (opts: CtxOpts) => opts.context?.linkSync;

  const broadcast = (repoId: number, event: string, payload: unknown) =>
    sse.channel(repoId).send(event, payload);

  const findLinkedElements = (sourceId: number) =>
    ContentElement.findAll({ where: { sourceId, isLinkedCopy: true } });

  const findLinkedActivities = (sourceId: number) =>
    Activity.findAll({ where: { sourceId, isLinkedCopy: true } });

  // Resolve unique outline activities for a list of elements.
  const resolveOutlineActivities = async (
    elements: ContentElement[],
  ): Promise<Activity[]> => {
    const activityIds = [...new Set(elements.map((el) => el.activityId))];
    const activities = await Activity.findAll({
      where: { id: activityIds },
      paranoid: true,
    });
    const result = new Map<number, Activity>();
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
  // after linked-content sync propagation. Accepts pre-resolved outline
  // activities (needed for deletion where elements are destroyed before
  // touching).
  const markLinkedAsChanged = async (
    repoIds: Set<number>,
    elements: ContentElement[] = [],
    outlineActivities?: Activity[],
  ) => {
    if (!repoIds.size) return;
    await Repository.update(
      { hasUnpublishedChanges: true } as Partial<Repository>,
      { where: { id: [...repoIds] } },
    );
    // Touch outline activities so per-item publish status reflects the change.
    const targets =
      outlineActivities ?? (await resolveOutlineActivities(elements));
    for (const activity of targets) {
      await activity.touch();
    }
  };

  // Auto-unlink a linked element when the user edits its `data`.
  // "If you edit it, you own it" - user edits break the source link. Also
  // unlinks the parent activity tree if the element is part of one.
  async function autoUnlinkOnEdit(
    _hookType: string,
    element: ContentElement,
    opts: UpdateOpts,
  ) {
    if (!element.isLinkedCopy) return;
    if (!opts.fields?.includes('data')) return;
    if (isLinkSync(opts)) return;
    // `sourceModifiedAt: null` clears the link;
    await element.update(
      { isLinkedCopy: false, sourceModifiedAt: null as unknown as undefined },
      { transaction: opts.transaction, hooks: false },
    );
    const entryPoint = await linkService.unlinkActivityIfLinked(
      element.activityId,
      opts.context,
      opts.transaction,
    );
    if (entryPoint) {
      broadcast(entryPoint.repositoryId, ActivityEvents.Update, entryPoint);
    }
  }

  // Propagate source element updates to all linked copies.
  // Skipped when:
  // - linkSync: update originated from the sync system itself (prevents loops)
  // - isOrWasLinkedCopy: element is a copy, not a source - only sources
  //   propagate. Checks previous('isLinkedCopy') to catch the case where
  //   autoUnlinkOnEdit cleared the flag in the same update cycle.
  async function propagateToLinkedElements(
    _hookType: string,
    element: ContentElement,
    opts: CtxOpts,
  ) {
    const isOrWasLinkedCopy =
      element.isLinkedCopy || element.previous('isLinkedCopy');
    if (isLinkSync(opts) || isOrWasLinkedCopy) return;
    const linkedElements = await findLinkedElements(element.id);
    if (!linkedElements.length) return;
    const affectedRepoIds = new Set<number>();
    for (const linked of linkedElements) {
      await linked.update(
        {
          data: element.data,
          meta: element.meta,
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

  // Propagate new element creation to all linked copies of the parent activity.
  // Skipped when:
  // - linkSync: creation originated from the sync system itself (prevents loops)
  // - isLinkedCopy: element was created as a copy, not as a new source element
  async function propagateElementCreation(
    _hookType: string,
    element: ContentElement,
    opts: CtxOpts,
  ) {
    if (isLinkSync(opts) || element.isLinkedCopy) return;
    const linkedActivities = await findLinkedActivities(element.activityId);
    if (!linkedActivities.length) return;
    log(
      `Propagating element ${element.id} creation
      to ${linkedActivities.length} linked activities`,
    );
    const affectedRepoIds = new Set<number>();
    const createdElements: ContentElement[] = [];
    for (const linkedActivity of linkedActivities) {
      // Cast through `unknown`: `Partial<>` is wider than Sequelize's
      // `Optional<T, NullishPropertiesOf<T>>` (which keeps non-nullable
      // attrs required). All required fields are supplied above.
      const newElement = await ContentElement.create(
        {
          ...pick(element, ['type', 'data', 'meta', 'position', 'contentId']),
          repositoryId: linkedActivity.repositoryId,
          activityId: linkedActivity.id,
          refs: {},
          isLinkedCopy: true,
          sourceId: element.id,
          sourceModifiedAt: element.updatedAt,
        } as unknown as ContentElement,
        SYNC_OPTS,
      );
      await resolveStatics(newElement);
      createdElements.push(newElement);
      affectedRepoIds.add(linkedActivity.repositoryId);
      broadcast(linkedActivity.repositoryId, Events.Create, newElement);
    }
    await markLinkedAsChanged(affectedRepoIds, createdElements);
  }

  // Propagate source element deletion to all linked copies.
  // Skipped when:
  // - linkSync: deletion originated from the sync system itself (prevents loops)
  // - isLinkedCopy: a copy was deleted, not the source
  async function propagateElementDeletion(
    _hookType: string,
    element: ContentElement,
    opts: CtxOpts,
  ) {
    if (isLinkSync(opts) || element.isLinkedCopy) return;
    const linkedElements = await findLinkedElements(element.id);
    if (!linkedElements.length) return;
    log(
      `Propagating element ${element.id} deletion
      to ${linkedElements.length} linked elements`,
    );
    const affectedRepoIds = new Set<number>();
    // Resolve outline activities before destroying elements.
    const outlineActivities = await resolveOutlineActivities(linkedElements);
    for (const linked of linkedElements) {
      await linked.destroy(SYNC_OPTS);
      affectedRepoIds.add(linked.repositoryId);
      broadcast(linked.repositoryId, Events.Delete, linked);
    }
    await markLinkedAsChanged(affectedRepoIds, [], outlineActivities);
  }

  // Unlink activity tree when a structural change occurs on a linked activity.
  async function unlinkActivity(
    element: ContentElement,
    opts: CtxOpts,
    reason: string,
  ) {
    if (isLinkSync(opts)) return;
    if (!element.activityId) return;
    log(`Checking activity unlink due to element ${reason}`);
    const entryPoint = await linkService.unlinkActivityIfLinked(
      element.activityId,
      opts.context,
      opts.transaction,
    );
    if (entryPoint) {
      broadcast(entryPoint.repositoryId, ActivityEvents.Update, entryPoint);
    }
  }

  async function unlinkActivityOnCreate(
    _hookType: string,
    element: ContentElement,
    opts: CtxOpts,
  ) {
    return unlinkActivity(element, opts, 'creation');
  }

  async function unlinkActivityOnDelete(
    _hookType: string,
    element: ContentElement,
    opts: CtxOpts,
  ) {
    return unlinkActivity(element, opts, 'deletion');
  }

  const elementHookMappings: Record<string, string[]> = {
    [Hooks.beforeCreate]: [elementHooks.BEFORE_SAVE],
    [Hooks.beforeUpdate]: [elementHooks.BEFORE_SAVE],
    [Hooks.afterCreate]: [elementHooks.AFTER_SAVE, elementHooks.AFTER_LOADED],
    [Hooks.afterUpdate]: [elementHooks.AFTER_SAVE, elementHooks.AFTER_LOADED],
  };

  async function customElementHook(
    hookType: string,
    element: ContentElement,
    options: CtxOpts,
  ) {
    const elementHookTypes = elementHookMappings[hookType];
    if (!elementHookTypes) return;
    const hooks = elementHookTypes
      .map(
        (hook) =>
          elementRegistry.getHook(element.type, hook) as PluginHook | undefined,
      )
      .filter((hook): hook is PluginHook => Boolean(hook));
    let result = element;
    for (const hook of hooks) {
      result = await hook(result, options);
    }
    return result;
  }

  // Prune virtual props before save. `data.assets` is a map of
  // `<virtual key in data> -> <storage URL>`; the authoring runtime
  // resolves those into `data[<virtual key>]` for display, but the
  // virtual keys must NOT travel to the DB. Rebuild `data` without the
  // virtual keys via `omit` rather than dynamic-key `delete`.
  function processAssets(hookType: string, element: ContentElement) {
    const isUpdate = hookType === Hooks.beforeUpdate;
    // On update, only proceed if the caller actually touched `data`
    if (isUpdate && !element.changed('data')) return Promise.resolve();
    const data = (element.data ?? {}) as Record<string, unknown>;
    // data.assets is an obj containing asset urls where key represents location
    // within data (where it should be resolved). If asset is internal
    // it will have storage:// protocol set.
    const assets = data.assets as AssetsMap | undefined;
    const virtualKeys = assets ? Object.keys(assets) : [];
    if (virtualKeys.length) {
      element.set('data', omit(data, virtualKeys));
    }
    element.contentSignature = hash(element.data, { algorithm: 'sha1' });
    return element;
  }

  function resolveAssets(_hookType: string, element: ContentElement) {
    return resolveStatics(element);
  }

  function touchRepository(
    _hookType: string,
    _element: ContentElement,
    { context = {} as OperationContext }: CtxOpts,
  ) {
    if (!isRepository(context.repository)) return Promise.resolve();
    return context.repository.update({
      hasUnpublishedChanges: true,
    } as Partial<Repository>);
  }

  async function touchOutline(
    _hookType: string,
    element: ContentElement,
    { context = {} as OperationContext }: CtxOpts,
  ) {
    if (!isRepository(context.repository)) return Promise.resolve();
    const activity = await resolveOutlineActivity(element);
    return activity?.touch();
  }

  function sseCreate(_hookType: string, element: ContentElement) {
    broadcast(element.repositoryId, Events.Create, element);
  }

  function sseUpdate(hookType: string, element: ContentElement) {
    const wasDetached =
      element.previous('detached') === false && element.detached;
    if (wasDetached) return sseDelete(hookType, element);
    broadcast(element.repositoryId, Events.Update, element);
  }

  async function sseDelete(_hookType: string, element: ContentElement) {
    await element.reload({ paranoid: false });
    broadcast(element.repositoryId, Events.Delete, element);
    // Orphan element-scoped comments by clearing their `activityId` so
    // they no longer appear in the parent activity's comment thread.
    // The row is preserved for audit; `contentElementId` still points
    // at the (soft-deleted) element.
    return Comment.update(
      { activityId: null },
      {
        where: { contentElementId: element.id },
        returning: true,
        paranoid: false,
      } as any,
    );
  }

  type HookFn = (
    hookType: string,
    element: ContentElement,
    options: UpdateOpts,
  ) => unknown;

  const mappings: Record<string, HookFn[]> = {
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

  // `mappings` keys come from `Hooks.<name>` Sequelize consts
  // (`beforeCreate`, `afterUpdate`, ...) so they ARE valid hook names at
  // runtime; the cast just bridges the loose `string` type that comes
  // out of iterating a `Record<string, ...>`.
  type SequelizeHookName = Parameters<typeof ContentElement.addHook>[0];
  forEach(mappings, (hooks, type) => {
    forEach(hooks, (hook) => {
      ContentElement.addHook(
        type as SequelizeHookName,
        Hooks.withType(type, hook),
      );
    });
  });
}

// Runs the per-element plugin fetch hooks (afterRetrieve + afterLoaded)
// against `element` and then resolves storage:// URLs in its assets bag.
// Invoked by `ContentElement.fetch`, `Revision.applyFetchHooks`.
type FetchHook = (el: ContentElement) => ContentElement | Promise<ContentElement>;

async function applyFetchHooks(element: ContentElement): Promise<ContentElement> {
  const { AFTER_RETRIEVE, AFTER_LOADED } = elementHooks;
  const hooks = [AFTER_RETRIEVE, AFTER_LOADED]
    .map((hook) => elementRegistry.getHook(element.type, hook) as FetchHook | undefined)
    .filter((hook): hook is FetchHook => Boolean(hook));
  const pipeline: FetchHook[] = [...hooks, resolveStatics as FetchHook];
  // Run fetch-time hooks sequentially, feeding the result of one into
  // the next. Final step resolves storage:// URLs in the assets bag.
  let result = element;
  for (const hook of pipeline) {
    result = await hook(result);
  }
  return result;
}

async function resolveOutlineActivity(
  element: ContentElement,
): Promise<Activity | undefined> {
  const activity = (await element.getActivity({ paranoid: true })) as
    | Activity
    | null;
  if (!activity) return;
  return schema.isOutlineActivity(activity.type)
    ? activity
    : activity.getOutlineParent();
}

export { add, applyFetchHooks };

export default { add, applyFetchHooks };
