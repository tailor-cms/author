import { activity as activityUtils } from '@tailor-cms/utils';
import { schema as schemaConfig } from '@tailor-cms/config';

import { useCurrentRepository } from '@/stores/current-repository';
import type { TopicItem } from './types';

const buildTopicMeta = (
  activity: any,
  activityCollection: any[],
  repositoryName: string,
): TopicItem => {
  const name = activity.data?.name || '';
  const isLeaf = schemaConfig.isEditable(activity.type);
  const ancestors = activityUtils.getAncestors(activityCollection, activity);
  const ancestorNames = ancestors.map((a: any) => a.data?.name).filter(Boolean);
  return {
    id: activity.id,
    name,
    isGroup: !isLeaf,
    parentName: ancestorNames.at(-1),
    breadcrumb: ancestorNames.toReversed().join(' / '),
    isLeaf,
    depth: ancestors.length,
    context: [name, ...ancestorNames, repositoryName].filter(Boolean),
  };
};

function flattenTree(nodes: any[]): TopicItem[] {
  const result: TopicItem[] = [];
  for (const node of nodes) {
    if (node.topicMeta) result.push(node.topicMeta);
    if (node.children?.length) {
      result.push(...flattenTree(node.children));
    }
  }
  return result;
}

/**
 * Derives a flat topic list from the repository outline.
 * Uses shared toTreeFormat for hierarchy, schemaConfig.isEditable
 * for leaf detection, and getAncestors for parent context.
 */
export function useOutlineTree() {
  const store = useCurrentRepository();
  const hasOutline = computed(() => store.outlineActivities.length > 0);

  const items = computed<TopicItem[]>(() => {
    const activities = store.outlineActivities as any[];
    if (!activities.length) return [];
    const repo = store.repository;
    const tree = activityUtils.toTreeFormat(activities, {
      processNodeFn: (activity: any) => ({
        topicMeta: buildTopicMeta(activity, activities, repo?.name || ''),
      }),
    });
    return flattenTree(tree);
  });

  return { hasOutline, items };
}
