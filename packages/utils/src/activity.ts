import type { Activity } from '@tailor-cms/interfaces/activity';
import filter from 'lodash/filter';
import find from 'lodash/find';
import get from 'lodash/get';
import sortBy from 'lodash/sortBy';

interface NodeProcessor {
  filterNodesFn?: (it: Activity[]) => Activity[];
  processNodeFn?: (it: Activity) => Activity;
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

export function getDescendants(
  activities: Activity[],
  activity: Activity,
): Activity[] {
  const children = filter(activities, { parentId: activity.id });
  if (!children.length) return [];
  const reducer = (acc: Activity[], it: Activity) => {
    return acc.concat(getDescendants(activities, it));
  };
  const descendants = children.reduce(reducer, []);
  return children.concat(descendants);
}

export function getAncestors(activities: Activity[], activity: Activity) {
  const parent = find(activities, { id: activity.parentId });
  if (!parent) return [];
  const ancestors: Activity[] = getAncestors(activities, parent);
  return [...ancestors, parent];
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
