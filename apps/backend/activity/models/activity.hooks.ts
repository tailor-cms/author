// Activity lifecycle hooks: SSE broadcasts, linked-content propagation
// (sync to copies, auto-unlink on edit, parent unlink on structural
// change), and repository / outline-activity touch-up for the
// hasUnpublishedChanges propagation chain.
import type { Transaction } from 'sequelize';
import forEach from 'lodash/forEach.js';
import groupBy from 'lodash/groupBy.js';
import { schema } from '@tailor-cms/config';

import { createLogger } from '#logger';
import linkService from '#shared/content-library/link.service.js';
import sse from '#shared/sse/index.js';
import type { OperationContext } from '#shared/database/types.ts';
import type RepositoryModel from '../../repository/models/repository.model.js';
import type { Repository } from '../../repository/models/repository.model.js';
import type ActivityModel from './activity.model.js';
import type { Activity } from './activity.model.js';

// Eagerly-included Repository belongsTo association on an Activity instance.
type ActivityWithRepository = Activity & { repository: Repository };

const logger = createLogger('activity:hooks');

const log = (msg: string) => logger.debug(msg.replace(/\n/g, ' '));
const { isOutlineActivity } = schema;

// Narrowed slices of the full Sequelize hook-options bag.
type CtxOpts = { context?: OperationContext; transaction?: Transaction };
type UpdateOpts = CtxOpts & { fields?: string[] };

interface ModelsBag {
  Repository: typeof RepositoryModel;
  Activity: typeof ActivityModel;
}

function add(Activity: typeof ActivityModel, Hooks: any, Models: ModelsBag) {
  const { Repository } = Models;
  const { Events } = Activity;

  const mappings: Record<string, any[]> = {
    [Hooks.afterCreate]: [
      unlinkParentOnStructuralChange,
      touchRepository,
      touchOutline,
      propagateActivityCreation,
      sseCreate,
    ],
    // Order matters: touchOutline must run before propagateToLinkedActivities
    // so modifiedAt is set before propagation uses it.
    [Hooks.afterUpdate]: [
      autoUnlinkOnEdit,
      touchRepository,
      touchOutline,
      propagateToLinkedActivities,
      sseUpdate,
    ],
    [Hooks.afterBulkUpdate]: [afterTransaction(sseBulkUpdate)],
    [Hooks.afterDestroy]: [
      unlinkParentOnStructuralChange,
      afterTransaction(propagateActivityDeletion),
      afterTransaction(unlinkCopiesOnDelete),
      touchRepository,
      touchOutline,
      sseDelete,
    ],
    [Hooks.afterRestore]: [touchRepository, touchOutline, sseUpdate],
  };

  // Unlink the parent tree when a structural change breaks the link.
  async function unlinkParentOnStructuralChange(
    _hookType: string,
    activity: Activity,
    opts: CtxOpts,
  ) {
    if (opts.context?.linkSync) return;
    if (!activity.parentId) return;
    log(`Checking parent unlink due to structural change`);
    const entryPoint = await linkService.unlinkActivityIfLinked(
      activity.parentId,
      opts.context,
      opts.transaction,
    );
    if (entryPoint) {
      sse.channel(entryPoint.repositoryId).send(Events.Update, entryPoint);
    }
  }

  // Unlink all copies when the source activity is deleted.
  async function unlinkCopiesOnDelete(_hookType: string, activity: Activity) {
    try {
      const unlinkedCopies = await linkService.unlinkCopiesOfSource(
        activity.id,
      );
      if (unlinkedCopies.length) {
        log(`Unlinked copies upon deletion for: ${activity.id}`);
        for (const copy of unlinkedCopies) {
          sse.channel(copy.repositoryId).send(Events.Update, copy);
        }
      }
    } catch (err: any) {
      log(`Error unlinking upon deletion ${activity.id}: ${err?.message}`);
    }
  }

  // Auto-unlink the linked activity when its data is edited.
  async function autoUnlinkOnEdit(
    _hookType: string,
    activity: Activity,
    opts: UpdateOpts,
  ) {
    if (!activity.isLinkedCopy) return;
    if (!opts.fields?.includes('data')) return;
    if (opts.context?.linkSync) return;
    await linkService.unlinkOnEdit(activity, opts.transaction);
  }

  // Propagate updates from a source activity to every linked copy.
  // - `linkSync` short-circuits to prevent recursive loops.
  // - linked copies don't propagate - only sources do.
  async function propagateToLinkedActivities(
    _hookType: string,
    activity: Activity,
    opts: CtxOpts,
  ) {
    if (opts.context?.linkSync) return;
    if (activity.isLinkedCopy) return;

    try {
      const linkedActivities = await Activity.unscoped().findAll({
        where: {
          sourceId: activity.id,
          isLinkedCopy: true,
        },
      });
      if (!linkedActivities.length) return;
      log(
        `Propagating update from activity ${activity.id}
        to ${linkedActivities.length} linked activities`,
      );
      const affectedRepoIds = new Set<number>();
      for (const it of linkedActivities) {
        await it.update(
          {
            data: { ...activity.data },
            sourceModifiedAt: activity.modifiedAt || new Date(),
          } as any,
          {
            context: { linkSync: true },
            hooks: false,
          } as any,
        );
        // Touch outline so modifiedAt reflects the change.
        // For non-outline activities, hoist up to the outline parent.
        const outlineActivity = isOutlineActivity(it.type)
          ? it
          : await it.getOutlineParent();
        if (outlineActivity) await outlineActivity.touch();
        affectedRepoIds.add(it.repositoryId);
        sse.channel(it.repositoryId).send(Events.Update, it);
      }
      if (affectedRepoIds.size) {
        await Repository.update({ hasUnpublishedChanges: true } as any, {
          where: { id: [...affectedRepoIds] },
        });
      }
    } catch (err) {
      logger.error({ err }, 'Error propagating to linked activities');
    }
  }

  // Active linked copies of a given source activity.
  const findActiveLinkedCopies = (
    sourceId: number,
    transaction?: Transaction,
  ): Promise<ActivityWithRepository[]> =>
    Activity.unscoped().findAll({
      where: { sourceId, isLinkedCopy: true },
      include: [Repository],
      transaction,
    }) as Promise<ActivityWithRepository[]>;

  /**
   * Propagate a newly-created child activity to every
   * linked copy of its parent.
   */
  async function propagateActivityCreation(
    _hookType: string,
    activity: Activity,
    opts: CtxOpts,
  ) {
    if (opts.context?.linkSync) return;
    if (activity.isLinkedCopy) return;
    if (!activity.parentId) return;
    try {
      const linkedParents = await findActiveLinkedCopies(
        activity.parentId,
        opts.transaction,
      );
      if (!linkedParents.length) return;
      log(
        `Propagating activity ${activity.id} creation
        to ${linkedParents.length} linked parents`,
      );
      for (const linkedParent of linkedParents) {
        await linkService.cloneActivityInto(
          activity,
          linkedParent.repository,
          linkedParent.id,
          activity.position,
          {
            context: { ...opts.context, repository: linkedParent.repository },
            transaction: opts.transaction,
          },
        );
      }
    } catch (err) {
      logger.error({ err }, 'Error propagating activity creation');
    }
  }

  /**
   * Propagate a source activity deletion to all linked copies.
   *
   * Uses the same `recursive: true, soft: true` options as the user-facing
   * `service.remove` (see `activity.service.ts` -> `remove`) so the cascade
   * is **indistinguishable from a manual delete and is fully revertable.
   */
  async function propagateActivityDeletion(
    _hookType: string,
    activity: Activity,
    opts: CtxOpts,
  ) {
    if (opts.context?.linkSync) return;
    if (activity.isLinkedCopy) return;
    try {
      const linkedCopies = await findActiveLinkedCopies(activity.id);
      if (!linkedCopies.length) return;
      log(
        `Propagating activity ${activity.id} deletion
        to ${linkedCopies.length} linked copies`,
      );
      for (const copy of linkedCopies) {
        await copy.remove({
          recursive: true,
          soft: true,
          context: {
            ...opts.context,
            repository: copy.repository,
            linkSync: true,
          },
        });
      }
    } catch (err) {
      logger.error({ err }, 'Error propagating activity deletion');
    }
  }

  forEach(mappings, (hooks, type) => {
    forEach(hooks, (hook) =>
      Activity.addHook(
        type as Parameters<typeof Activity.addHook>[0],
        Hooks.withType(type, hook),
      ),
    );
  });

  function sseCreate(_hookType: string, activity: Activity) {
    sse.channel(activity.repositoryId).send(Events.Create, activity);
  }

  function sseUpdate(_hookType: string, activity: Activity) {
    sse.channel(activity.repositoryId).send(Events.Update, activity);
  }

  async function sseBulkUpdate(_hookType: string, { where }: { where: any }) {
    const activities = await Models.Activity.findAll({ where });
    const activitiesByRepository = groupBy(activities, 'repositoryId');
    forEach(activitiesByRepository, (activities, repositoryId) => {
      sse.channel(Number(repositoryId)).send(Events.BulkUpdate, activities);
    });
  }

  async function sseDelete(_hookType: string, activity: Activity) {
    await activity.reload({ paranoid: false });
    sse.channel(activity.repositoryId).send(Events.Delete, activity);
  }

  const isRepository = (it: unknown) => it instanceof Models.Repository;

  function touchRepository(
    hookType: string,
    activity: Activity,
    { context = {} as OperationContext }: CtxOpts,
  ) {
    if (!isRepository(context.repository)) return Promise.resolve();
    return hookType === Hooks.afterDestroy && isOutlineActivity(activity.type)
      ? Promise.resolve()
      : context.repository.update({
          hasUnpublishedChanges: true,
        } as any);
  }

  async function touchOutline(
    _hookType: string,
    activity: Activity,
    { context = {} as OperationContext, transaction }: CtxOpts,
  ) {
    if (!isRepository(context.repository)) return Promise.resolve();
    const outlineActivity = isOutlineActivity(activity.type)
      ? activity
      : await activity.getOutlineParent(transaction);
    return outlineActivity && outlineActivity.touch(transaction);
  }
}

// Defer a hook until the surrounding transaction commits; falls back to
// immediate invocation when there is no transaction.
// Sequelize calls hooks with different arities depending on hook kind:
//   afterBulkUpdate / afterBulkDestroy: (options)
//   afterCreate / afterUpdate / afterDestroy:  (instance, options)
//   afterBulkCreate:                           (instances, options)
// `Hooks.withType` prepends the hook-type name, so the wrapped handler
// receives `(hookType, ...originalArgs)`. The options bag is therefore
// always the LAST argument; pick it from there instead of guessing the
// slot (the previous 2-arg version mistakenly read the instance as opts
// on per-instance hooks, making the wrap a no-op for afterDestroy).
type SequelizeHookFn = (...args: any[]) => unknown;
const afterTransaction = <T extends SequelizeHookFn>(method: T): T =>
  function (this: unknown, ...args: any[]) {
    const opts = args[args.length - 1];
    if (!opts?.transaction) return method.apply(this, args);
    opts.transaction.afterCommit(() => method.apply(this, args));
  } as T;

export default { add };
