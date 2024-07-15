import filter from 'lodash/filter';
import find from 'lodash/find';
import get from 'lodash/get';
import sortBy from 'lodash/sortBy';

export function isChanged(activity) {
  return (
    !activity.publishedAt ||
    new Date(activity.modifiedAt) > new Date(activity.publishedAt)
  );
}

// Determine if previously published activity is now deleted
// and the deletion is not published yet.
export function doesRequirePublishing(activity) {
  if (!activity.publishedAt) return false;
  if (!activity.deletedAt) return false;
  const dateDeleted = new Date(activity.deletedAt).getTime();
  const datePublished = new Date(activity.publishedAt).getTime();
  if (dateDeleted < datePublished) return true;
}

export function getParent(activities, activity) {
  const id = get(activity, 'parentId', null);
  return id && find(activities, { id });
}

export function getChildren(activities, parentId) {
  return sortBy(filter(activities, { parentId }), 'position');
}

export function getDescendants(activities, activity) {
  const children = filter(activities, { parentId: activity.id });
  if (!children.length) return [];
  const reducer = (acc, it) => acc.concat(getDescendants(activities, it));
  const descendants = children.reduce(reducer, []);
  return children.concat(descendants);
}

export function getAncestors(activities, activity) {
  const parent = find(activities, { id: activity.parentId });
  if (!parent) return [];
  const ancestors = getAncestors(activities, parent);
  return [...ancestors, parent];
}

export function toTreeFormat(
  activities,
  { filterNodesFn = it => it, processNodeFn },
  _internals = {}
) {
  const { parentId = null, level = 1, maxLevel = 20 } = _internals;
  if (level > maxLevel) throw new Error('Max level exceeded');
  const parentActivities = filter(activities, { parentId });
  return filterNodesFn(parentActivities).map(activity => ({
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
        level: level + 1
      }
    ),
    ...processNodeFn && processNodeFn(activity)
  }));
}
