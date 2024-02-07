import {
  activity as activityUtils,
  calculatePosition,
  InsertLocation,
} from '@tailor-cms/utils';
import findIndex from 'lodash/findIndex';
import { schema } from 'tailor-config-shared';

import type { Activity } from '@/api/interfaces/activity';
import { activity as api } from '@/api';

type Id = number | string;
type FoundActivity = Activity | undefined

export const useActivityStore = defineStore('activities', () => {
  const $items = reactive(new Map<string, Activity>());
  const items = computed(() => Array.from($items.values()));

  function findById(id: Id): FoundActivity {
    if (typeof id === 'string') return $items.get(id);
    return items.value.find((it: Activity) => it.id === id);
  }

  const getParent = (id: Id): FoundActivity => {
    const activity = findById(id);
    return activity?.parentId ? findById(activity.parentId) : undefined;
  };

  function getDescendants(id: Id): Activity[] {
    const activity = findById(id);
    return activity ? activityUtils.getDescendants(items.value, activity) : [];
  }

  function getAncestors(id: Id): Activity[] {
    const activity = findById(id);
    return activityUtils.getAncestors(items.value, activity);
  }

  function getLineage(id: Id): Activity[] {
    const activity = findById(id);
    const ancestors = activityUtils.getAncestors(items.value, activity);
    const descendants = activityUtils.getDescendants(items.value, activity);
    return [...ancestors, ...descendants];
  }

  function where(predicate: (activity: Activity) => boolean): Activity[] {
    return items.value.filter(predicate);
  }

  function add(item: Activity): Activity {
    $items.set(item.uid, item);
    return item;
  }

  async function fetch(repositoryId: number): Promise<Activity[]> {
    const activities: Activity[] = await api.getActivities(repositoryId);
    $items.clear();
    activities.forEach((it) => add(it));
    return activities;
  }

  async function save(payload: any): Promise<Activity> {
    const activity = await api.save(payload);
    add(activity);
    return activity;
  }

  function calculateInsertPosition(
    activity: Activity,
    action: string,
    anchor: Activity,
  ) {
    const children = schema.getOutlineChildren(items.value, activity.parentId);
    const context = { items: children, action } as any;
    if (action !== InsertLocation.ADD_INTO) {
      context.newPosition = anchor ? findIndex(children, { id: anchor.id }) : 1;
    }
    return calculatePosition(context);
  }

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
    calculateInsertPosition,
    $reset,
  };
});
