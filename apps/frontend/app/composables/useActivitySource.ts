import type { MaybeRefOrGetter } from 'vue';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { Repository } from '@tailor-cms/interfaces/repository';
import { api } from '@/api';

export interface ActivitySource {
  id: number;
  repository: Pick<Repository, 'id' | 'name' | 'schema'>;
}

/**
 * Resolves the source of a linked activity and exposes navigation to it.
 * The source is refetched whenever the activity changes and cleared when
 * the activity is not (or no longer) a linked copy.
 */
export const useActivitySource = (
  activity: MaybeRefOrGetter<Activity | null | undefined>,
) => {
  const source = ref<ActivitySource | null>(null);

  watch(
    () => toValue(activity),
    async (val) => {
      source.value = null;
      if (!val?.isLinkedCopy || !val.sourceId) return;
      source.value = (await api.activity
        .getSource({
          params: { repositoryId: val.repositoryId, activityId: val.id },
        })
        .catch(() => null)) as ActivitySource | null;
    },
    { immediate: true },
  );

  const viewSource = () => {
    if (!source.value) return;
    navigateTo({
      name: 'repository',
      params: { id: source.value.repository.id },
      query: { activityId: source.value.id },
    });
  };

  return { source, viewSource };
};
