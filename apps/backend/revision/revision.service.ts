// Business logic for the Revision slice.
// Revisions are append-only audit rows written by the per-model hooks.
import { Op } from 'sequelize';
import map from 'lodash/map.js';

import { Entity, Operation } from '@tailor-cms/interfaces/revision';
import { createLogger } from '#logger';
import db from '#shared/database/index.js';
import type { ListQuery } from './revision.schema.ts';
import type { Repository } from '../repository/models/repository.model.js';
import type { Revision } from './models/revision.model.js';

const { Revision: RevisionModel, User } = db;

const logger = createLogger('revision:svc');

// Sequelize include builder for the user who authored the revision.
// `paranoid: false` so historical attribution survives the user being
// soft-deleted.
const includeUser = () => ({
  model: User,
  paranoid: false,
  attributes: [
    'id',
    'email',
    'firstName',
    'lastName',
    'fullName',
    'label',
    'imgUrl',
  ],
});

export interface ListResult {
  total: number;
  items: Revision[];
}

// Lists revisions for a repository, optionally narrowed to a specific
// entity instance. `opts` is the `processQuery`.
// When `entity` is provided, callers must also supply `entityId`;
// we match against the JSON `state.id` field so the result is the
// audit trail for that specific entity.
export async function list(
  repository: Repository,
  opts: any,
  filters: ListQuery,
): Promise<ListResult> {
  const where: any = { repositoryId: repository.id };
  if (filters.entity) {
    where.entity = filters.entity;
    where.state = { id: filters.entityId };
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

export interface TimeTravelParams {
  timestamp: string;
  elementIds: number[];
}

export interface TimeTravelResult {
  activities: Revision[];
  elements: Revision[];
}

// Reconstructs the published state of an activity at `timestamp`.
// Two passes:
//   1. Detect every activity/element under `activity` that was REMOVED
//      after `timestamp` but had been CREATED before it - those rows
//      were visible at the target moment.
//   2. Pull the latest CREATE/UPDATE before `timestamp` for the union
//      of (currently-existing element ids + ids resurrected in pass 1).
// Returned shape mirrors the FE's `PublishDiffProvider` reducer:
// `activities` and `elements` are flat revision lists
export async function timeTravel(
  activity: any,
  params: TimeTravelParams,
): Promise<TimeTravelResult> {
  const { timestamp } = params;
  const elementIds = params.elementIds.map(Number);
  logger.debug(
    { activityId: activity.id, timestamp, elementCount: elementIds.length },
    'Reconstructing state at moment',
  );
  const removes = await getEntityRemovesSinceMoment(activity, timestamp);
  const entityIds = [...elementIds, ...map(removes.elements, 'state.id')];
  const removedActivityIds = map(removes.activities, 'state.id');
  const elements = await getStateAt(entityIds, removedActivityIds, timestamp);
  return { ...removes, elements };
}

// Finds activity + element REMOVE revisions in `activity`'s subtree that
// happened after `timestamp` but where the entity itself was CREATED
// before `timestamp`. The combined filter is what "was visible then but
// is gone now" actually means in revision-table terms.
async function getEntityRemovesSinceMoment(
  activity: any,
  timestamp: string,
): Promise<TimeTravelResult> {
  const { nodes } = await activity.descendants({ paranoid: false });
  const subtreeIds = map(nodes, 'id');
  const where = {
    operation: Operation.Remove,
    createdAt: { [Op.gt]: timestamp },
    state: { createdAt: { [Op.lt]: timestamp } },
  } as any;
  const [activities, elements] = await Promise.all([
    RevisionModel.fetch({
      where: {
        ...where,
        entity: Entity.Activity,
        state: { ...where.state, id: { [Op.in]: subtreeIds } },
      },
    }),
    RevisionModel.fetch({
      where: {
        ...where,
        entity: Entity.ContentElement,
        state: { ...where.state, activityId: { [Op.in]: subtreeIds } },
      },
    }),
  ]);
  return { activities, elements };
}

// State of each entity at `timestamp` - the latest CREATE/UPDATE
// revision before that moment. `activityIds` catches elements whose
// activity was removed mid-flight.
function getStateAt(
  ids: number[],
  activityIds: number[],
  timestamp: string,
): Promise<Revision[]> {
  return RevisionModel.scope('lastByEntity').fetch({
    where: {
      operation: { [Op.or]: [Operation.Create, Operation.Update] },
      createdAt: { [Op.lt]: timestamp },
      state: {
        [Op.or]: [
          { id: { [Op.in]: ids } },
          { activityId: { [Op.in]: activityIds } },
        ],
      },
    } as any,
  });
}

// Re-exported as named symbols so tests can stub them without going
// through `service.list`.
export { getEntityRemovesSinceMoment, getStateAt };
