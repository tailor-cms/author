// Business logic for the Activity slice.
// All DB orchestration, cross-model coordination (publishing, linked
// content) and shape transforms live here so the service surface is
// testable in isolation from Express.
import { Op } from 'sequelize';
import find from 'lodash/find.js';
import get from 'lodash/get.js';
import { schema } from '@tailor-cms/config';

import { createLogger } from '#logger';
import db from '#shared/database/index.js';
import linkService from '#shared/content-library/link.service.js';
import publishingService from '#shared/publishing/publishing.service.js';
import type { Repository } from '../repository/models/repository.model.js';
import type { User } from '../user/models/user.model.js';
import type { Activity, ActivityCopyLocation } from './models/activity.model.js';

import type { CreateBody } from './actions/create.action.ts';
import type { PatchBody } from './actions/patch.action.ts';
import type { CloneBody } from './actions/clone.action.ts';
import type { LinkBody } from './actions/link.action.ts';
import type { WorkflowStatusBody } from './actions/workflow-status-update.action.ts';

const { Activity: ActivityModel, sequelize } = db;
const { getOutlineLevels, isOutlineActivity } = schema;

const logger = createLogger('activity:svc');

export interface ListFilters {
  // When true, include detached items (unreachable in the outline because
  // an ancestor activity was deleted). Default: false.
  detached?: boolean;
  // When true, restrict to outline-level activities (those declared in
  // the schema's outline structure). Soft-deleted-but-published items
  // are included so the FE can show "deleted, awaiting publish" rows.
  outlineOnly?: boolean;
}

// Returns the repository's activities, optionally restricted to
// outline-only items + pending-unpublish soft-deleted entries.
export async function list(
  repository: Repository,
  opts: any,
  filters: ListFilters,
): Promise<Activity[]> {
  if (!filters.detached) opts.where.detached = false;
  if (filters.outlineOnly) {
    // Include deleted if published and deletion is not published yet
    opts.paranoid = false;
    opts.where.type = getOutlineLevels(repository.schema).map((it) => it.type);
    opts.where[Op.or] = [
      { deletedAt: null },
      {
        publishedAt: {
          [Op.ne]: null,
          [Op.lt]: sequelize.col('activity.deleted_at'),
        },
      },
    ];
  }
  const activities = (await repository.getActivities(opts)) as Activity[];
  await Promise.all(activities.map((it) => it.processEmbeddedElements()));
  return activities;
}

// Creates an activity under `repository`. The action's Zod schema has
// already stripped unknown keys from `body`, so the wire shape *is* the
// persisted attribute set; we just seed `data` with the schema's
// `defaultMeta` for the outline level (so newly-created outline rows
// land with the right shape) and inject `repositoryId` from the loaded
// repo.
export async function create(
  repository: Repository,
  user: User,
  body: CreateBody,
): Promise<Activity> {
  const outlineConfig = find(getOutlineLevels(repository.schema), {
    type: body.type,
  });
  const context = { userId: user.id, repository };
  const activity = await ActivityModel.create(
    {
      ...body,
      data: { ...get(outlineConfig, 'defaultMeta', {}), ...(body.data ?? {}) },
      repositoryId: repository.id,
    } as any,
    { context } as any,
  );
  await activity.processEmbeddedElements();
  return activity;
}

// Decorates a loaded activity with its embedded-element snapshot for FE
// display. Used by the `get` action.
export async function loadDetail(activity: Activity): Promise<Activity> {
  await activity.processEmbeddedElements();
  return activity;
}

// Updates mutable fields.
export async function update(
  repository: Repository,
  user: User,
  activity: Activity,
  body: PatchBody,
): Promise<Activity> {
  const context = { userId: user.id, repository };
  if (
    isOutlineActivity(activity.type) &&
    activity.parentId &&
    body.parentId &&
    body.parentId !== activity.parentId
  ) {
    const parent = await ActivityModel.findByPk(activity.parentId);
    if (parent) await parent.touch();
  }
  const updated = await activity.update(body as any, { context } as any);
  await updated.processEmbeddedElements();
  return updated;
}

// Soft-deletes the target activity (paranoid `deletedAt`) and marks all
// descendants (activities + content elements) as `detached: true` so they
// drop out of the outline while staying in the DB. For outline activities,
// recomputes the repository's `hasUnpublishedChanges` so the publish bar
// reflects the deletion.
export async function remove(
  repository: Repository,
  user: User,
  activity: Activity,
): Promise<{ id: number }> {
  const context = { userId: user.id, repository };
  const options = { recursive: true, soft: true, context };
  const deleted = await activity.remove(options);
  if (isOutlineActivity(activity.type)) {
    await publishingService.updatePublishingStatus(repository);
  }
  return { id: deleted.id };
}

// Restores the activity and its descendants from soft-delete.
export async function restore(
  repository: Repository,
  user: User,
  activity: Activity,
): Promise<Activity> {
  const context = { userId: user.id, repository };
  await activity.restoreWithDescendants({ context });
  return activity;
}

// Recalculates `position` from a target index among schema-defined
// sibling types.
export function reorder(
  repository: Repository,
  user: User,
  activity: Activity,
  position: number,
): Promise<Activity> {
  const context = { userId: user.id, repository };
  return activity.reorder(position, context);
}

// Publishes / unpublishes (when the activity is already soft-deleted)
// the activity through the publishing service.
export async function publish(activity: Activity): Promise<unknown> {
  logger.info({ activityId: activity.id }, '[publish] initiated');
  return activity.deletedAt
    ? publishingService.unpublishActivity(activity)
    : publishingService.publishActivity(activity);
}

// Deep-clones the activity into the target (repository, parent, position).
// Returns the cloned activity rows so the FE store can hydrate them.
export async function clone(
  user: User,
  activity: Activity,
  body: CloneBody,
): Promise<Activity[]> {
  const mappings = await activity.clone(
    body.repositoryId,
    body.parentId ?? null,
    body.position as number | undefined,
    { userId: user.id },
  );
  const ids = Object.values(mappings.activityId);
  return ActivityModel.findAll({ where: { id: ids } }) as Promise<Activity[]>;
}

// Creates a workflow status row for the activity and reloads it (so the
// assignee include is populated for the FE).
export async function updateWorkflowStatus(
  user: User,
  activity: Activity,
  body: WorkflowStatusBody,
) {
  const context = { user };
  const status = await activity.createStatus(body, { context } as any);
  await status.reload();
  return status;
}

// Links an activity tree from another repository as a linked copy in
// the target repository. Access to both repos was verified upstream by
// the `hasLinkSourceAccess` route middleware.
export async function link(
  repository: Repository,
  user: User,
  body: LinkBody,
): Promise<Activity> {
  const context = { userId: user.id, repository };
  return linkService.linkActivity(
    body.sourceId,
    repository,
    body.parentId ?? null,
    body.position,
    context,
  );
}

// Converts a linked activity into an independent local copy. For
// hierarchical links, descendants (activities + elements) are unlinked
// transitively by the link service.
export async function unlink(
  repository: Repository,
  user: User,
  activity: Activity,
): Promise<Activity> {
  const context = { userId: user.id, repository };
  return linkService.unlinkActivity(activity.id, context);
}

// Returns active linked copies of this source activity across repos,
// filtered to entry-point copies (not nested under another linked copy).
export function getCopies(
  activity: Activity,
): Promise<ActivityCopyLocation[]> {
  return activity.findCopyLocations();
}

// Returns the source activity's repository pointer for a linked copy,
// or null when the source is missing or the activity is not a copy.
export async function getSource(activity: Activity) {
  if (!activity.sourceId) return null;
  const source = (await ActivityModel.findByPk(activity.sourceId, {
    include: ['repository' as any],
  }));
  if (!source) return null;
  return { id: source.id, repository: source.repository };
}
