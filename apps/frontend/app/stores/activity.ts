import type { Activity, Status } from '@tailor-cms/interfaces/activity';
import {
  activity as activityUtils,
  calculatePosition,
  InsertLocation,
} from '@tailor-cms/utils';
import { findIndex, orderBy } from 'lodash-es';
import { schema, workflow as workflowConfig } from '@tailor-cms/config';
import { Activity as Events } from '@tailor-cms/common/src/sse.js';
import Hashids from 'hashids';

import { activity as api } from '@/api';
import sseRepositoryFeed from '@/lib/RepositoryFeed';

const { getDefaultActivityStatus } = workflowConfig;

type Id = number | string;
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

  function getDescendants(id: Id): StoreActivity[] {
    const activity = findById(id);
    return activity
      ? activityUtils.getDescendants(items.value, activity) as StoreActivity[]
      : [];
  }

  function getAncestors(id: Id): StoreActivity[] {
    const activity = findById(id);
    return activity
      ? activityUtils.getAncestors(items.value, activity) as StoreActivity[]
      : [];
  }

  function getLineage(id: Id): StoreActivity[] {
    const activity = findById(id);
    if (!activity) return [];
    const ancestors = activityUtils.getAncestors(items.value, activity);
    const descendants = activityUtils.getDescendants(items.value, activity);
    return [...ancestors, ...descendants] as StoreActivity[];
  }

  function where(
    predicate: (activity: StoreActivity) => boolean,
  ): StoreActivity[] {
    return items.value.filter(predicate);
  }

  function add(item: Activity): StoreActivity | undefined {
    $items.set(item.uid, {
      ...item,
      shortId: `A-${hashids.encode(item.id)}`,
      currentStatus: getActivityStatus(item),
    });
    return $items.get(item.uid);
  }

  async function fetch(
    repositoryId: number,
    params = {},
  ): Promise<StoreActivity[]> {
    const activities: Activity[] = await api.getActivities(
      repositoryId,
      params,
    );
    // Reset if repository is changed
    if (
      items.value.length > 0 &&
      items.value[0].repositoryId !== repositoryId
    ) {
      $items.clear();
    }
    activities.forEach((it) => add(it));
    return items.value;
  }

  async function save(payload: any): Promise<StoreActivity | undefined> {
    const activity = await api.save(payload);
    add(activity);
    return $items.get(activity.uid);
  }

  async function update(payload: any): Promise<FoundActivity> {
    const activity = findById(payload.id);
    if (!activity) return;
    const updatedActivity = await api.patch({
      ...payload,
      id: activity.id,
      repositoryId: activity.repositoryId,
    });
    Object.assign(activity, updatedActivity);
    return activity;
  }

  async function remove(id: Id): Promise<undefined> {
    const activity = findById(id);
    if (!activity) return;
    await api.remove(activity.repositoryId, activity.id);
    // Await SSE event for store removal
  }

  const reorder = async (reorderdActivity: StoreActivity, context: any) => {
    const activity = findById(reorderdActivity.uid);
    if (!activity) return;
    // If activity is reordered via drag and drop, we need to recalculate its position
    const position = context.position === undefined
      ? calculatePosition(context) as number
      : context.position;
    const payload = { position: context.newPosition || position };
    const data = await api.reorder(activity.repositoryId, activity.id, payload);
    Object.assign(activity, data);
  };

  const publish = async (activity: StoreActivity) => {
    const { publishedAt } = await api.publish(
      activity.repositoryId,
      activity.id,
    );
    activity.publishedAt = publishedAt;
    if (activity.deletedAt) $items.delete(activity.uid);
  };

  const clone = async (mapping: any) => {
    const { srcId, srcRepositoryId } = mapping;
    const activities = await api.clone(srcRepositoryId, srcId, mapping);
    activities.forEach((activity: Activity) => add(activity));
    return activities;
  };

  function calculateInsertPosition(
    activity: StoreActivity,
    action: InsertLocation,
    anchor: StoreActivity,
  ) {
    const children = schema.getOutlineChildren(items.value, activity.parentId);
    const context = { items: children, action } as any;
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
    const context = { items: children, action } as any;
    if (action !== AddInto) {
      context.newPosition = anchor ? findIndex(children, { id: anchor.id }) : 1;
    }
    return calculatePosition(context);
  };

  const saveStatus = async (id: number, status: Status) => {
    const activity = findById(id);
    if (!activity) return;
    const data = await api.updateStatus(
      activity.repositoryId,
      activity.id,
      status,
    );
    Object.assign(activity, { status: data });
  };

  const $subscribeToSSE = () => {
    sseRepositoryFeed
      .subscribe(Events.Create, (it: Activity) => add(it))
      .subscribe(Events.Update, (it: Activity) => add(it))
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

  function getActivityStatus({ status, type }: Activity) {
    const defaultStatus = getDefaultActivityStatus(type);
    if (!Array.isArray(status)) return status || defaultStatus;
    const ordered = orderBy(status, (it) => new Date(it.updatedAt), ['desc']);
    return ordered[0] || defaultStatus;
  }

  return {
    $items,
    items,
    findById,
    getParent,
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
    calculateInsertPosition,
    calculateCopyPosition,
    saveStatus,
    $subscribeToSSE,
    $reset,
  };
});
