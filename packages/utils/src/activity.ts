import { filter, find, get, sortBy } from 'lodash-es';
import type { Activity } from '@tailor-cms/interfaces/activity';

interface NodeProcessor {
  filterNodesFn?: (it: Activity[]) => Activity[];
  processNodeFn?: (it: Activity) => any;
}

interface Internals {
  parentId?: number;
  level?: number;
  maxLevel?: number;
}

export function isChanged(activity: Activity) {
  return (
    !activity.publishedAt ||
    new Date(activity.modifiedAt) > new Date(activity.publishedAt)
  );
}

export function doesRequirePublishing(activity: Activity) {
  if (!activity.publishedAt) return false;
  if (!activity.deletedAt) return false;
  const dateDeleted = new Date(activity.deletedAt).getTime();
  const datePublished = new Date(activity.publishedAt).getTime();
  return dateDeleted > datePublished;
}

export function getParent(activities: Activity[], activity: Activity) {
  const id = get(activity, 'parentId', null);
  return id && find(activities, { id });
}

export function getChildren(activities: Activity[], parentId: number) {
  return sortBy(filter(activities, { parentId }), 'position');
}

// Generic over the element type so callers using a refined shape
// (e.g. `StoreActivity = Activity & { shortId; currentStatus }`) get the
// refined type back instead of the base `Activity`. The function only
// returns items it filtered out of `activities`, so the runtime types
// are always preserved.
export function getDescendants<T extends Activity>(
  activities: T[],
  activity: Activity,
): T[] {
  const children = activities.filter((it) => it.parentId === activity.id);
  if (!children.length) return [];
  const descendants = children.reduce<T[]>(
    (acc, it) => acc.concat(getDescendants(activities, it)),
    [],
  );
  return children.concat(descendants);
}

export function getAncestors<T extends Activity>(
  activities: T[],
  activity: Activity,
): T[] {
  const parent = activities.find((it) => it.id === activity.parentId);
  if (!parent) return [];
  return [...getAncestors(activities, parent), parent];
}

export function toTreeFormat(
  activities: Activity[],
  processors: NodeProcessor,
  _internals: Internals = {},
): Activity[] {
  const { filterNodesFn = (it) => it, processNodeFn } = processors;
  const { parentId = null, level = 1, maxLevel = 20 } = _internals;
  if (level > maxLevel) throw new Error('Max level exceeded');
  const parentActivities = filter(activities, { parentId });
  return filterNodesFn(parentActivities).map((activity) => ({
    ...activity,
    name: activity.data.name,
    title: activity.data.name,
    level,
    children: toTreeFormat(
      activities,
      { filterNodesFn, processNodeFn },
      {
        ..._internals,
        parentId: activity.id,
        level: level + 1,
      },
    ),
    ...(processNodeFn && processNodeFn(activity)),
  }));
}
