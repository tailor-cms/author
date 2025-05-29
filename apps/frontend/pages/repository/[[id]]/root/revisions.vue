<template>
  <VContainer max-width="1200">
    <VInfiniteScroll
      v-if="revisions.length > 0"
      class="revisions"
      color="primary-lighten-4"
      mode="manual"
      @load="loadMore"
    >
      <VList bg-color="transparent" lines="two" tag="ul">
        <RevisionItem
          v-for="revision in bundledRevisions"
          :key="revision.uid"
          :revision="revision"
        />
      </VList>
      <template #load-more="{ props: scrollProps }">
        <VBtn v-if="!areAllItemsFetched" variant="tonal" v-bind="scrollProps">
          Load more
        </VBtn>
      </template>
    </VInfiniteScroll>
    <VAlert
      v-else-if="!isFetching && revisions.length === 0"
      class="mt-8"
      color="primary-lighten-4"
      icon="mdi-history"
      variant="tonal"
      prominent
    >
      No changes recorded!
    </VAlert>
  </VContainer>
</template>

<script lang="ts" setup>
import { last, reduce, uniq, uniqBy } from 'lodash-es';
import type { Revision } from '@tailor-cms/interfaces/revision';

import api from '@/api/revision';
import { isSameInstance } from '@/lib/revision';
import RevisionItem from '@/components/repository/Revisions/RevisionItem.vue';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({
  name: 'revisions',
});

const { $ceRegistry, $eventBus } = useNuxtApp() as any;
const currentRepositoryStore = useCurrentRepository();
const activityStore = useActivityStore();
const editorStore = useEditorStore();
const authStore = useAuthStore();

const editorChannel = $eventBus.channel('editor');
provide('$getCurrentUser', () => authStore.user);
provide('$editorBus', editorChannel);
provide('$ceRegistry', $ceRegistry);
provide('$editorState', {
  isPublishDiff: computed(() => editorStore.showPublishDiff),
});

const isFetching = ref(true);
const revisions = ref<Revision[]>([]);
const queryParams = reactive({ offset: 0, limit: 100 });
const areAllItemsFetched = ref(false);

const bundledRevisions = computed(() => {
  return reduce(
    revisions.value,
    (acc: Revision[], it: Revision) => {
      const prevRevision = last(acc);
      if (prevRevision) {
        const isSameOperation = prevRevision.operation === it.operation;
        if (!isSameInstance(prevRevision, it) || !isSameOperation) acc.push(it);
      }
      return acc;
    },
    [revisions.value[0]],
  );
});

const fetchRevisions = async () => {
  isFetching.value = true;
  const repositoryId = currentRepositoryStore.repository?.id;
  if (!repositoryId) return;
  const { items, total }: { items: Revision[]; total: number } =
    await api.fetch(repositoryId, queryParams);
  revisions.value = uniqBy([...revisions.value, ...items], 'uid');
  // Make sure to fetch all activities for the revisions
  const activityIds = uniq(
    items.map((it) => it.state.activityId || it.state.id),
  );
  await activityStore.fetch(repositoryId, { activityIds });
  areAllItemsFetched.value = total <= queryParams.offset + queryParams.limit;
  queryParams.offset += queryParams.limit;
  isFetching.value = false;
};

const loadMore = async (options: any) => {
  await fetchRevisions();
  options.done('ok');
};

onMounted(() => {
  return fetchRevisions();
});
</script>

<style lang="scss" scoped>
.revisions {
  padding: 1rem 0.75rem 1.875rem;
  text-align: left;

  ul {
    max-width: 75rem;
    padding: 0.5rem 0;
    list-style-type: none;

    li {
      width: 100%;
    }
  }
}
</style>
