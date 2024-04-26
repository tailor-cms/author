<template>
  <VContainer>
    <VInfiniteScroll
      v-if="revisions.length > 0"
      class="revisions"
      color="primary-lighten-2"
      empty-text=""
      mode="manual"
      @load="fetchRevisions"
    >
      <ul>
        <RevisionItem
          v-for="revision in bundledRevisions"
          :key="revision.uid"
          :revision="revision"
        />
      </ul>
      <template #load-more="{ props }">
        <v-btn v-if="!areAllItemsFetched" variant="tonal" v-bind="props">
          Load more
        </v-btn>
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
import last from 'lodash/last';
import reduce from 'lodash/reduce';
import uniqBy from 'lodash/uniqBy';

import api from '@/api/revision';
import { isSameInstance } from '@/lib/revision';
import RevisionItem from '@/components/repository/Revisions/RevisionItem.vue';
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({
  name: 'revisions',
});

const currentRepositoryStore = useCurrentRepository();

const isFetching = ref(true);
const revisions = ref([]);
const queryParams = reactive({ offset: 0, limit: 100 });
const areAllItemsFetched = ref(false);

const bundledRevisions = computed(() => {
  return reduce(
    revisions.value,
    (acc: any, it: any) => {
      const prevRevision = last(acc) as any;
      if (!prevRevision) return acc.push(it);
      const isSameOperation = prevRevision?.operation === it.operation;
      if (!isSameInstance(prevRevision, it) || !isSameOperation) acc.push(it);
      return acc;
    },
    [revisions.value[0]],
  );
});

const fetchRevisions = async () => {
  isFetching.value = true;
  const { items, total } = await api.fetch(
    currentRepositoryStore.repository?.id,
    queryParams,
  );
  revisions.value = uniqBy([...revisions.value, ...items], 'uid');
  areAllItemsFetched.value = total <= queryParams.offset + queryParams.limit;
  isFetching.value = false;
};

const resetPagination = () => {
  queryParams.offset = 0;
  queryParams.limit = 200;
};

onMounted(() => {
  resetPagination();
  fetchRevisions();
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
