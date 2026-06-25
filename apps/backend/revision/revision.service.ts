// Business logic for the Revision slice.
// Revisions are append-only audit rows written by the per-model hooks.
import { Op } from 'sequelize';
import { randomUUID } from 'node:crypto';
import map from 'lodash/map.js';
import isEqual from 'lodash/isEqual.js';
import differenceBy from 'lodash/differenceBy.js';

import { Entity, Operation } from '@tailor-cms/interfaces/revision';
import { activity as activityUtils } from '@tailor-cms/utils';
import type { Activity } from '#app/activity/models/activity.model.js';
import type {
  ListFilter,
  ReconstructEntity,
  ReconstructChange,
  ReconstructResult,
  RestoreResult,
} from './schemas/index.ts';
import type { ListQueryOptions } from '#shared/request/action.ts';
import type { Repository } from '../repository/models/repository.model.js';
import type { Revision } from './models/revision.model.js';
import type { User as UserType } from '../user/models/user.model.js';
import { USER_SUMMARY_ATTRS } from '#app/user/schemas/entity.ts';
import { createLogger } from '#logger';
import db from '#shared/database/index.js';
import * as activityService from '../activity/activity.service.ts';
import * as contentElementService from '../content-element/content-element.service.ts';

const { Activity, ContentElement, Revision: RevisionModel, User } = db;
const { getDescendants } = activityUtils;

const logger = createLogger('revision:svc');

export interface ListResult {
  total: number;
  items: Revision[];
}

interface SubtreeSnapshot {
  activities: any[];
  elements: any[];
}

const mapById = (states: any[]) =>
  new Map<number, any>(states.map((state) => [state.id, state]));

const includeUser = () => ({
  model: User,
  paranoid: false,
  attributes: USER_SUMMARY_ATTRS,
});

// Root + descendants as full instances (incl. soft-deleted/detached),
// parent-first - the order the restore cascade relies on.
async function getSubtreeActivities(id: number): Promise<any[]> {
  const root: any = await Activity.findByPk(id, { paranoid: false });
  if (!root) return [];
  const { nodes } = await root.descendants({ paranoid: false });
  return nodes;
}

// Latest non-tombstone state per entity at or before `at`. The REMOVE check
// happens *after* `lastByEntity` picks the latest-per-entity (not in the
// query) - that ordering is what stops an already-deleted entity from being
// resurrected by its last surviving edit.
async function aliveStatesAt(where: any, at: string): Promise<any[]> {
  const revisions = (await RevisionModel.scope('lastByEntity').fetch({
    where: { ...where, createdAt: { [Op.lte]: at } },
  })) as Revision[];
  return revisions
    .filter(({ operation }) => operation !== Operation.Remove)
    .map(({ state }) => state);
}

// Lists a repository's revisions. `entity`+`entityId` scopes to one entity's
// trail; `activityId` returns its whole subtree timeline (for the editor sidebar).
export async function list(
  repository: Repository,
  opts: ListQueryOptions,
  filters: ListFilter,
): Promise<ListResult> {
  const where: any = { repositoryId: repository.id };
  if (filters.entity) {
    where.entity = filters.entity;
    where.state = { id: filters.entityId };
  } else if (filters.activityId) {
    // Content elements hang off child container activities, not the page
    // directly, so match the whole subtree's ids, not just `pageId`.
    const subtree = await getSubtreeActivities(filters.activityId);
    if (subtree.length === 0) return { total: 0, items: [] };
    const inSubtree = { [Op.in]: map(subtree, 'id') };
    where[Op.or] = [
      { entity: Entity.Activity, state: { id: inSubtree } },
      { entity: Entity.ContentElement, state: { activityId: inSubtree } },
    ];
  }
  Object.assign(opts, { where, include: [includeUser()] });
  const { rows, count } = await RevisionModel.findAndCountAll(opts);
  return { total: count, items: rows as Revision[] };
}

// Loads a single revision by numeric id. The route's param middleware
// has already verified the revision belongs to the current repository.
export function get(id: number): Promise<Revision> {
  return RevisionModel.fetch(id, { include: [includeUser()] });
}

// Resets an activity's whole subtree to its state at or before `timestamp` by
// replaying through the live services - so each change emits a fresh revision
// rather than rewriting history (additive restore, like Google Docs / Figma).
//
// Limitations:
//   - Hard-deleted ids can't be resurrected (lookup keys are gone).
//   - Not transactional: a mid-cascade failure leaves a partial restore;
//     re-running converges on the target.
export async function restoreToMoment(
  repository: Repository,
  user: UserType,
  { id: activityId }: Activity,
  timestamp: string,
): Promise<RestoreResult> {
  // One id stamped on every revision this cascade produces, so the UI can
  // collapse the whole restore into a single history entry.
  const audit = { transactionId: randomUUID() };

  const currentActivities = await getSubtreeActivities(activityId);
  const subtreeIds = map(currentActivities, 'id');

  // 1. Activities: reset survivors, remove the rest (never the root).
  const aliveActivities = await aliveStatesAt(
    { entity: Entity.Activity, state: { id: { [Op.in]: subtreeIds } } },
    timestamp,
  );
  const activityTargets = mapById(aliveActivities);
  for (const activity of currentActivities) {
    const target = activityTargets.get(activity.id);
    if (target) {
      // restore() clears the soft-delete and un-detaches the subtree, so a
      // removed container and its elements become reachable again.
      if (activity.deletedAt) {
        await activityService.restore(repository, user, activity, audit);
      }
      await activityService.update(
        repository,
        user,
        activity,
        { position: target.position, data: target.data, refs: target.refs ?? {} },
        audit,
      );
    } else if (activity.id !== activityId && !activity.deletedAt) {
      await activityService.remove(repository, user, activity, audit);
    }
  }

  // 2. Elements, reloaded so pass 1's un-detaches are visible.
  const elements = await ContentElement.findAll({
    where: { activityId: { [Op.in]: subtreeIds } },
    paranoid: false,
  });
  const elementIds = map(elements, 'id');
  const aliveElements = await aliveStatesAt(
    { entity: Entity.ContentElement, state: { id: { [Op.in]: elementIds } } },
    timestamp,
  );
  const elementTargets = mapById(aliveElements);
  for (const element of elements) {
    const target = elementTargets.get(element.id);
    if (target) {
      // `element.update` only persists fields in the body, so `deletedAt: null`
      // must be explicit to un-soft-delete - else a content-identical element is
      // a no-op write (no revision): the "still soft-deleted" bug.
      await contentElementService.update(
        repository,
        user,
        element,
        {
          position: target.position,
          data: target.data,
          meta: target.meta,
          refs: target.refs ?? {},
          ...(element.deletedAt ? { deletedAt: null } : {}),
        },
        audit,
      );
    } else if (!element.deletedAt) {
      await contentElementService.remove(repository, user, element, audit);
    }
  }

  logger.debug(
    { activityId, timestamp, elementCount: elements.length },
    'Restored activity to moment',
  );

  return { activityId, elementCount: elements.length };
}

// Full subtree snapshot (activity + element states) alive at `at`.
async function snapshotAt(
  activity: Activity,
  at: string,
): Promise<SubtreeSnapshot> {
  // Whole repo, not the current subtree: the tree shape may differ at `at`.
  const aliveActivities = await aliveStatesAt(
    { entity: Entity.Activity, repositoryId: activity.repositoryId },
    at,
  );
  const descendants = getDescendants(aliveActivities, activity);
  const root = aliveActivities.find((state: any) => state.id === activity.id);
  const activities = root ? [root, ...descendants] : descendants;
  const inSubtree = { [Op.in]: [activity.id, ...map(descendants, 'id')] };
  const elements = await aliveStatesAt(
    { entity: Entity.ContentElement, state: { activityId: inSubtree } },
    at,
  );
  return { activities, elements };
}

// Same content = data/meta/refs deep-equal (identity/lifecycle ignored, so a
// no-op save isn't a "change").
const sameContent = (a: any, b: any) =>
  isEqual(a.data, b.data) &&
  isEqual(a.meta, b.meta) &&
  isEqual(a.refs, b.refs);

const toReconstructEntity = (
  state: any,
  change: ReconstructChange | null = null,
): ReconstructEntity => ({ id: state.id, uid: state.uid, state, change });

// Tags each entity by how it differs between the two snapshots (by id).
function diffStates(atStates: any[], againstStates: any[]): ReconstructEntity[] {
  const baseline = mapById(againstStates);
  const present = atStates.map((state) => {
    const previous = baseline.get(state.id);
    if (!previous) return toReconstructEntity(state, 'new');
    if (sameContent(state, previous)) return toReconstructEntity(state, null);
    return toReconstructEntity(state, 'changed');
  });
  // In `against` but not `at` -> removed (keeps its baseline state).
  const removed = differenceBy(againstStates, atStates, 'id').map((state) =>
    toReconstructEntity(state, 'removed'),
  );
  return present.concat(removed);
}

// Reconstructs an activity's subtree as it existed at `at`; with `against`
// set, tags each entity with how it changed between the two moments.
export async function reconstruct(
  activity: Activity,
  at: string,
  against: string | null = null,
): Promise<ReconstructResult> {
  logger.debug(
    { activityId: activity.id, at, against },
    'Reconstructing subtree at moment',
  );
  const { activities, elements } = await snapshotAt(activity, at);
  if (!against) {
    return {
      at,
      against: null,
      activities: map(activities, (state) => toReconstructEntity(state)),
      elements: map(elements, (state) => toReconstructEntity(state)),
    };
  }
  const baseline = await snapshotAt(activity, against);
  return {
    at,
    against,
    activities: diffStates(activities, baseline.activities),
    elements: diffStates(elements, baseline.elements),
  };
}
