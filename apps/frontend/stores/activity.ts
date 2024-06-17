import {
  activity as activityUtils,
  calculatePosition,
  InsertLocation,
} from '@tailor-cms/utils';
import { Activity as Events } from 'sse-event-types';
import findIndex from 'lodash/findIndex';
import Hashids from 'hashids';
import { schema } from 'tailor-config-shared';

import type { Activity } from '@/api/interfaces/activity';
import { activity as api } from '@/api';
import sseRepositoryFeed from '@/lib/RepositoryFeed';

export type Id = number | string;
export type StoreActivity = Activity & { shortId: string };
export type FoundActivity = StoreActivity | undefined;

const HASH_ALPHABET = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
const hashids = new Hashids('', 0, HASH_ALPHABET);

export const useActivityStore = defineStore('activities', () => {
  const $items = reactive(new Map<string, StoreActivity>());
  const items = computed(() => Array.from($items.values()));

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
    return activity ? activityUtils.getDescendants(items.value, activity) : [];
  }

  function getAncestors(id: Id): StoreActivity[] {
    const activity = findById(id);
    return activityUtils.getAncestors(items.value, activity);
  }

  function getLineage(id: Id): StoreActivity[] {
    const activity = findById(id);
    const ancestors = activityUtils.getAncestors(items.value, activity);
    const descendants = activityUtils.getDescendants(items.value, activity);
    return [...ancestors, ...descendants];
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
      // status: getActivityStatus(it)
    });
    return $items.get(item.uid) as StoreActivity;
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

  async function save(payload: any): Promise<StoreActivity> {
    const activity = await api.save(payload);
    add(activity);
    return $items.get(activity.uid) as StoreActivity;
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
    $items.delete(activity.uid);
  }

  const reorder = async (reorderdActivity: StoreActivity, context: any) => {
    const activity = findById(reorderdActivity.uid);
    if (!activity) return;
    const position = calculatePosition(context) as number;
    activity.position = position;
    const payload = { position: context.newPosition };
    const data = await api.reorder(activity.repositoryId, activity.id, payload);
    Object.assign(activity, data);
  };

  const publish = async (activity: StoreActivity) => {
    const { publishedAt } = await api.publish(
      activity.repositoryId,
      activity.id,
    );
    activity.publishedAt = publishedAt;
  };

  const clone = async (mapping: any) => {
    const { srcId, srcRepositoryId } = mapping;
    const activities = await api.clone(srcRepositoryId, srcId, mapping);
    activities.forEach((activity: Activity) => add(activity));
    return activities;
  };

  function calculateInsertPosition(
    activity: StoreActivity,
    action: string,
    anchor: StoreActivity,
  ) {
    const children = schema.getOutlineChildren(items.value, activity.parentId);
    const context = { items: children, action } as any;
    if (action !== InsertLocation.ADD_INTO) {
      context.newPosition = anchor ? findIndex(children, { id: anchor.id }) : 1;
    }
    return calculatePosition(context);
  }

  const calculateCopyPosition = (action: string, anchor: Activity) => {
    const id = action === InsertLocation.ADD_INTO ? anchor.id : anchor.parentId;
    const children = schema.getOutlineChildren(items.value, id);
    const context = { items: children, action } as any;
    if (action !== InsertLocation.ADD_INTO) {
      context.newPosition = findIndex(children, { id: anchor.id });
    }
    return calculatePosition(context);
  };

  const $subscribeToSSE = () => {
    sseRepositoryFeed
      .subscribe(Events.Create, (it: Activity) => add(it))
      .subscribe(Events.Update, (it: Activity) => add(it))
      .subscribe(Events.Delete, (it: Activity) => $items.delete(it.uid));
  };

  function $reset() {
    $items.clear();
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
    $subscribeToSSE,
    $reset,
  };
});
