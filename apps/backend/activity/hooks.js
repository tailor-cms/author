import forEach from 'lodash/forEach.js';
import groupBy from 'lodash/groupBy.js';
import { schema } from '@tailor-cms/config';

import { createLogger } from '#logger';
import sse from '#shared/sse/index.js';

const { isOutlineActivity } = schema;

const logger = createLogger('activity:hooks');
const log = (msg) => logger.debug(msg.replace(/\n/g, ' '));

function add(Activity, Hooks, Models) {
  const { Events } = Activity;

  const mappings = {
    [Hooks.afterCreate]: [touchRepository, touchOutline, sseCreate],
    // Order matters: touchOutline must run before propagateToLinkedActivities
    // so modifiedAt is set before propagation uses it
    [Hooks.afterUpdate]: [
      autoDetachOnEdit,
      touchRepository,
      touchOutline,
      propagateToLinkedActivities,
      sseUpdate,
    ],
    [Hooks.afterBulkUpdate]: [afterTransaction(sseBulkUpdate)],
    [Hooks.afterDestroy]: [touchRepository, touchOutline, sseDelete],
    [Hooks.afterRestore]: [touchRepository, touchOutline, sseUpdate],
  };

  /**
   * Auto-detach linked activity when data is edited.
   * "If you edit it, you own it" - user edits break the library link.
   */
  async function autoDetachOnEdit(_hookType, activity, opts) {
    if (!activity.isLinkedCopy) return;
    if (!opts.fields?.includes('data')) return;
    // libraryUpdate: system is syncing from source, not a user edit - keep link
    if (opts.context?.libraryUpdate) return;
    // Break the link (keep sourceId for provenance)
    await activity.update(
      {
        isLinkedCopy: false,
        sourceModifiedAt: null,
      },
      {
        transaction: opts.transaction,
        hooks: false, // Prevent recursion
      },
    );
  }

  /**
   * Propagate updates to all activities linked to this source activity.
   * Automatic sync: when source changes, all linked copies update.
   */
  async function propagateToLinkedActivities(_hookType, activity, opts) {
    // libraryUpdate: already syncing from source, skip to prevent infinite loop
    if (opts.context?.libraryUpdate) return;
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
      for (const it of linkedActivities) {
        await it.update(
          {
            data: { ...activity.data },
            sourceModifiedAt: activity.modifiedAt || new Date(),
          },
          {
            context: { libraryUpdate: true },
            hooks: false, // Prevent recursion
          },
        );
        // Send SSE update
        sse.channel(it.repositoryId).send(Events.Update, it);
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
