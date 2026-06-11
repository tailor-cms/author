import type {
  ActivityCloneReq,
  ActivityCreateReq,
  ActivityListReq,
  ActivityUpdateReq,
} from '@tailor-cms/api-client';
import type { Activity, Status } from '@tailor-cms/interfaces/activity';

import {
  activity as activityUtils,
  calculatePosition,
  InsertLocation,
  type PositionConfig,
} from '@tailor-cms/utils';
import { findIndex, maxBy } from 'lodash-es';
import { schema, workflow as workflowConfig } from '@tailor-cms/config';
import { Activity as Events } from '@tailor-cms/common/src/sse.js';
import Hashids from 'hashids';

import { api } from '@/api';
import sseRepositoryFeed from '@/lib/RepositoryFeed';

const { getDefaultActivityStatus } = workflowConfig;

type Id = number | string;

// Mutable workflow fields the BE accepts on `setStatus`.
type StatusUpdate = {
  assigneeId?: number | null;
  status?: string;
  priority?: string;
  description?: string | null;
  dueDate?: string | null;
};

// Most-recent workflow row for an activity, or a `Status`-shaped
// placeholder built from the schema's default `{ status, priority }`
// pair when no row exists yet.
function getActivityStatus(activity: Activity): Status {
  const latest = maxBy(activity.status, 'updatedAt');
  if (latest) return latest;
  const defaults = getDefaultActivityStatus(activity.type);
  return {
    id: 0,
    activityId: activity.id,
    assigneeId: null,
    assignee: null,
    status: defaults?.status ?? '',
    priority: defaults?.priority ?? '',
    description: null,
    dueDate: null,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
    deletedAt: null,
  };
}

export type StoreActivity = Activity & {
  shortId: string;
  currentStatus: Status;
};
export type FoundActivity = StoreActivity | undefined;

const HASH_ALPHABET = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
const hashids = new Hashids('', 0, HASH_ALPHABET);

const { AddInto } = InsertLocation;

export const useActivityStore = defineStore('activities', () => {
  const $items = reactive(new Map<string, StoreActivity>());
  const items = computed<StoreActivity[]>(() => Array.from($items.values()));

  function findById(id: Id): FoundActivity {
    if (typeof id === 'string') return $items.get(id);
    return items.value.find((it: StoreActivity) => it.id === id);
  }

  const getParent = (id: Id): FoundActivity => {
    const activity = findById(id);
    return activity?.parentId ? findById(activity.parentId) : undefined;
  };

  /**
   * Check if activity is a link entry point (explicitly linked, not nested).
   * Entry point = linked but parent is not linked.
   * Nested copy = linked because parent was linked (came along for the ride).
   */
  const isLinkEntryPoint = (id: Id): boolean => {
    const activity = findById(id);
    if (!activity?.isLinkedCopy) return false;
    const parent = getParent(id);
    return !parent?.isLinkedCopy;
  };

  function getDescendants(id: Id): StoreActivity[] {
    const activity = findById(id);
    return activity ? activityUtils.getDescendants(items.value, activity) : [];
  }

  function getAncestors(id: Id): StoreActivity[] {
    const activity = findById(id);
    return activity ? activityUtils.getAncestors(items.value, activity) : [];
  }

  function getLineage(id: Id): StoreActivity[] {
    const activity = findById(id);
    if (!activity) return [];
    return [
      ...activityUtils.getAncestors(items.value, activity),
      ...activityUtils.getDescendants(items.value, activity),
    ];
  }

  function where(
    predicate: (activity: StoreActivity) => boolean,
  ): StoreActivity[] {
    return items.value.filter(predicate);
  }

  function add(item: Activity): StoreActivity {
    $items.set(item.uid, {
      ...item,
      shortId: `A-${hashids.encode(item.id)}`,
      currentStatus: getActivityStatus(item),
    });
    return $items.get(item.uid) as StoreActivity;
  }

  async function fetch(
    repositoryId: number,
    params: ActivityListReq['query'] = {},
  ): Promise<StoreActivity[]> {
    const activities = await api.activity.list({
      params: { repositoryId },
      query: params,
    });
    // Reset if repository is changed
    if (
      items.value.length > 0 &&
      items.value[0]!.repositoryId !== repositoryId
    ) {
      $items.clear();
    }
    activities.forEach((it) => add(it));
    return items.value;
  }

  async function save(
    payload: ActivityCreateReq['body'] & { repositoryId: number },
  ): Promise<StoreActivity | undefined> {
    const { repositoryId, ...body } = payload;
    const activity = await api.activity.create({
      params: { repositoryId },
      body,
    });
    add(activity);
    return $items.get(activity.uid);
  }

  async function update(
    payload: ActivityUpdateReq['body'] & { id: number },
  ): Promise<FoundActivity> {
    const activity = findById(payload.id);
    if (!activity) return;
    const { id: _id, ...body } = payload;
    const updatedActivity = await api.activity.update({
      params: { repositoryId: activity.repositoryId, activityId: activity.id },
      body,
    });
    Object.assign(activity, updatedActivity);
    return activity;
  }

  async function remove(id: Id): Promise<undefined> {
    const activity = findById(id);
    if (!activity) return;
    await api.activity.delete({
      params: { repositoryId: activity.repositoryId, activityId: activity.id },
    });
    // Await SSE event for store removal
  }

  const reorder = async (
    reorderedActivity: StoreActivity,
    context: PositionConfig & { newPosition: number },
  ) => {
    const activity = findById(reorderedActivity.uid);
    if (!activity) return;
    activity.position = calculatePosition(context);
    const data = await api.activity.reorder({
      params: { repositoryId: activity.repositoryId, activityId: activity.id },
      body: { position: context.newPosition },
    });
    Object.assign(activity, data);
  };

  const publish = async (activity: StoreActivity) => {
    const data = await api.activity.publish({
      params: { repositoryId: activity.repositoryId, activityId: activity.id },
    });
    activity.publishedAt = data.publishedAt;
    if (activity.deletedAt) $items.delete(activity.uid);
  };

  const clone = async (
    mapping: ActivityCloneReq['body'] & {
      srcId: number;
      srcRepositoryId: number;
    },
  ) => {
    const { srcId, srcRepositoryId, ...rest } = mapping;
    const activities = await api.activity.clone({
      params: { repositoryId: srcRepositoryId, activityId: srcId },
      body: rest,
    });
    activities.forEach((activity) => add(activity));
    return activities;
  };

  function calculateInsertPosition(
    activity: StoreActivity,
    action: InsertLocation,
    anchor: StoreActivity,
  ) {
    const children = schema.getOutlineChildren(items.value, activity.parentId);
    const context: PositionConfig = { items: children, action };
    if (action !== AddInto) {
      context.newPosition = anchor ? findIndex(children, { id: anchor.id }) : 1;
    }
    return calculatePosition(context);
  }

  const calculateCopyPosition = (
    action: InsertLocation,
    anchor: Activity | null,
  ) => {
    const id = anchor && (action === AddInto ? anchor.id : anchor.parentId);
    const children = schema.getOutlineChildren(items.value, id);
    const context: PositionConfig = { items: children, action };
    if (action !== AddInto) {
      context.newPosition = anchor ? findIndex(children, { id: anchor.id }) : 1;
    }
    return calculatePosition(context);
  };

  const unlink = async (id: Id) => {
    const activity = findById(id);
    if (!activity) return;
    const unlinked = await api.activity.unlink({
      params: { repositoryId: activity.repositoryId, activityId: activity.id },
    });
    add(unlinked);
    return unlinked;
  };

  const saveStatus = async (id: number, status: StatusUpdate) => {
    const activity = findById(id);
    if (!activity) return;
    const data = await api.activity.setStatus({
      params: { repositoryId: activity.repositoryId, activityId: activity.id },
      body: status,
    });
    Object.assign(activity, { status: data });
  };

  const $subscribeToSSE = () => {
    sseRepositoryFeed
      .subscribe(Events.Create, (it: Activity) => add(it))
      .subscribe(Events.Update, (it: Activity) => add(it))
      .subscribe(Events.BulkUpdate, (items: Activity[]) => items.forEach(add))
      .subscribe(Events.Delete, (it: Activity) => {
        const activity = it.deletedAt
          ? it
          : { ...it, deletedAt: new Date().toISOString() };
        const requirePublishing = activityUtils.doesRequirePublishing(activity);
        if (requirePublishing) add(activity as Activity);
        else $items.delete(activity.uid);
      });
  };

  function $reset() {
    $items.clear();
  }

  return {
    $items,
    items,
    findById,
    getParent,
    isLinkEntryPoint,
    getAncestors,
    getDescendants,
    getLineage,
    where,
    add,
    fetch,
    save,
    update,
    remove,
    publish,
    clone,
    reorder,
    unlink,
    calculateInsertPosition,
    calculateCopyPosition,
    saveStatus,
    $subscribeToSSE,
    $reset,
  };
});
