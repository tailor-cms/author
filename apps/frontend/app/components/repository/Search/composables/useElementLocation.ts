import type { MaybeRefOrGetter } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { SearchElement } from './useContentElementSearch';
import { useActivityStore } from '@/stores/activity';

/**
 * Resolves a search result's outline context from the activity store:
 * the outline lineage (for breadcrumbs), the closest editable ancestor,
 * and the editor route deep-linking to the element.
 */
export function useElementLocation(element: MaybeRefOrGetter<SearchElement>) {
  const { $schemaService } = useNuxtApp() as any;
  const activityStore = useActivityStore();

  const outlineActivity = computed(() => {
    const { outlineActivityId } = toValue(element);
    return outlineActivityId
      ? activityStore.findById(outlineActivityId)
      : null;
  });

  // Outline chain down to the element's location, root first.
  const lineage = computed(() => {
    if (!outlineActivity.value) return [];
    return [
      ...activityStore.getAncestors(outlineActivity.value.id),
      outlineActivity.value,
    ];
  });

  const breadcrumbs = computed(
    () =>
      lineage.value.map((it) => it.data?.name).filter(Boolean) as string[],
  );

  const editorActivity = computed(() =>
    [...lineage.value].reverse().find((it) => $schemaService.isEditable(it.type)),
  );

  const editorRoute = computed<RouteLocationRaw | null>(() => {
    if (!editorActivity.value) return null;
    const { repositoryId, uid } = toValue(element);
    return {
      name: 'editor',
      params: { id: repositoryId, activityId: editorActivity.value.id },
      query: { elementId: uid },
    };
  });

  return { outlineActivity, lineage, breadcrumbs, editorActivity, editorRoute };
}
