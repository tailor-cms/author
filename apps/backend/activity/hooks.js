import forEach from 'lodash/forEach.js';
import groupBy from 'lodash/groupBy.js';
import { schema } from '@tailor-cms/config';

import { createLogger } from '#logger';
import linkService from '#shared/content-library/link.service.js';
import sse from '#shared/sse/index.js';

const { isOutlineActivity } = schema;

const logger = createLogger('activity:hooks');
const log = (msg) => logger.debug(msg.replace(/\n/g, ' '));

function add(Activity, Hooks, Models) {
  const { Repository } = Models;
  const { Events } = Activity;

  const mappings = {
    [Hooks.afterCreate]: [
      unlinkParentOnStructuralChange,
      touchRepository,
      touchOutline,
      sseCreate,
    ],
    // Order matters: touchOutline must run before propagateToLinkedActivities
    // so modifiedAt is set before propagation uses it
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
      afterTransaction(unlinkCopiesOnDelete),
      touchRepository,
      touchOutline,
      sseDelete,
    ],
    [Hooks.afterRestore]: [touchRepository, touchOutline, sseUpdate],
  };

  /** Unlink parent tree when structural change breaks the link. */
  async function unlinkParentOnStructuralChange(_hookType, activity, opts) {
    if (opts.context?.linkSync) return;
    if (!activity.parentId) return;
    log(`Checking parent unlink due to structural change`);
    const entryPoint = await linkService.unlinkParentIfLinked(
      activity.parentId,
      opts.context,
      opts.transaction,
    );
    if (entryPoint) {
      sse.channel(entryPoint.repositoryId).send(Events.Update, entryPoint);
    }
  }

  /** Unlink all copies when source activity is deleted. */
  async function unlinkCopiesOnDelete(_hookType, activity) {
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
    } catch (err) {
      log(`Error unlinking upon deletion ${activity.id}: ${err.message}`);
    }
  }

  /** Auto-unlink linked activity when data is edited. */
  async function autoUnlinkOnEdit(_hookType, activity, opts) {
    if (!activity.isLinkedCopy) return;
    if (!opts.fields?.includes('data')) return;
    if (opts.context?.linkSync) return;
    await linkService.unlinkOnEdit(activity, opts.transaction);
  }

  /**
   * Propagate updates to all activities linked to this source activity.
   * Automatic sync: when source changes, all linked copies update.
   */
  async function propagateToLinkedActivities(_hookType, activity, opts) {
    // linkSync: already syncing from source, skip to prevent infinite loop
    if (opts.context?.linkSync) return;
    // Linked copies don't propagate - only sources do
    if (activity.isLinkedCopy) return;

    try {
      // Find all activities linked to this source
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
      // Update each linked activity with the new data
      const affectedRepoIds = new Set();
      for (const it of linkedActivities) {
        await it.update(
          {
            data: { ...activity.data },
            sourceModifiedAt: activity.modifiedAt || new Date(),
          },
          {
            context: { linkSync: true },
            hooks: false, // Prevent recursion
          },
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
      // Mark affected repositories as having unpublished changes
      if (affectedRepoIds.size) {
        await Repository.update(
          { hasUnpublishedChanges: true },
          { where: { id: [...affectedRepoIds] } },
        );
      }
    } catch (err) {
      logger.error('Error propagating to linked activities:', err);
    }
  }

  forEach(mappings, (hooks, type) => {
    forEach(hooks, (hook) =>
      Activity.addHook(type, Hooks.withType(type, hook)),
    );
  });

  function sseCreate(_, activity) {
    sse.channel(activity.repositoryId).send(Events.Create, activity);
  }

  function sseUpdate(_, activity) {
    sse.channel(activity.repositoryId).send(Events.Update, activity);
  }

  async function sseBulkUpdate(_, { where }) {
    const activities = await Models.Activity.findAll({ where });
    const activitiesByRepository = groupBy(activities, 'repositoryId');
    forEach(activitiesByRepository, (activities, repositoryId) => {
      sse.channel(repositoryId).send(Events.BulkUpdate, activities);
    });
  }

  async function sseDelete(_, activity) {
    await activity.reload({ paranoid: false });
    sse.channel(activity.repositoryId).send(Events.Delete, activity);
  }

  const isRepository = (it) => it instanceof Models.Repository;

  function touchRepository(hookType, activity, { context = {} }) {
    if (!isRepository(context.repository)) return Promise.resolve();
    // setting correct hasUnpublishedChanges value is handled by
    // remove activity middleware for outline activities
    return hookType === Hooks.afterDestroy && isOutlineActivity(activity.type)
      ? Promise.resolve()
      : context.repository.update({ hasUnpublishedChanges: true });
  }

  async function touchOutline(
    _hookType,
    activity,
    { context = {}, transaction },
  ) {
    if (!isRepository(context.repository)) return Promise.resolve();
    const outlineActivity = isOutlineActivity(activity.type)
      ? activity
      : await activity.getOutlineParent(transaction);
    return outlineActivity && outlineActivity.touch(transaction);
  }
}

const afterTransaction = (method) => (type, opts) => {
  if (!opts.transaction) return method(type, opts);
  opts.transaction.afterCommit(() => method(type, opts));
};

export default {
  add,
};
