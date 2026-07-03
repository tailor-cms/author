<template>
  <div ref="scrollerEl" class="revisions-page overflow-auto h-100">
    <VContainer max-width="1200">
      <VInfiniteScroll
        v-if="bundledRevisions.length > 0"
        class="revisions"
        mode="manual"
        @load="loadMore"
      >
        <VList bg-color="transparent" lines="two" tag="ul">
          <li
            v-for="group in groupedRevisions"
            :key="group.key"
            class="revision-day-group"
          >
            <div class="revision-day-header">
              <span class="text-label-medium text-uppercase text-medium-emphasis">
                {{ group.label }}
              </span>
            </div>
            <ul class="revision-day-items">
              <RevisionItem
                v-for="revision in group.items"
                :key="revision.uid"
                :revision="revision"
              />
            </ul>
          </li>
        </VList>
        <template #load-more="{ props: scrollProps }">
          <VBtn
            v-if="!areAllItemsFetched"
            :text="'Load more'"
            v-bind="scrollProps"
            variant="tonal"
          />
        </template>
      </VInfiniteScroll>
      <VAlert
        v-else-if="!isFetching && bundledRevisions.length === 0"
        class="mt-8"
        icon="mdi-history"
        text="No changes recorded!"
        variant="tonal"
        prominent
      />
    </VContainer>
    <VFadeTransition>
      <VBtn
        v-show="isScrolled"
        aria-label="Back to top"
        class="back-to-top"
        color="primary"
        icon="mdi-arrow-up"
        size="small"
        variant="tonal"
        @click="scrollToTop"
      />
    </VFadeTransition>
  </div>
</template>

<script lang="ts" setup>
import { last, reduce, uniq, uniqBy } from 'lodash-es';
import { useScroll } from '@vueuse/core';
import type { Revision } from '@tailor-cms/interfaces/revision';

import { api } from '@/api';
import { groupByDay, isSameRun } from '@/lib/revision';
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
provide('$editorState', { showDiff: computed(() => editorStore.showDiff) });

const isFetching = ref(true);
const revisions = ref<Revision[]>([]);
const queryParams = reactive({ offset: 0, limit: 100 });
const areAllItemsFetched = ref(false);

const bundledRevisions = computed<Revision[]>(() => {
  if (!revisions.value.length) return [];
  return reduce(
    revisions.value,
    (acc: Revision[], it: Revision) => {
      const prevRevision = last(acc);
      if (prevRevision && !isSameRun(prevRevision, it)) acc.push(it);
      return acc;
    },
    [revisions.value[0]] as Revision[],
  );
});

const groupedRevisions = computed(() => groupByDay(bundledRevisions.value));

const fetchRevisions = async () => {
  isFetching.value = true;
  const repositoryId = currentRepositoryStore.repository?.id;
  if (!repositoryId) return;
  const { items, total } = await api.revision.list({
    params: { repositoryId },
    query: queryParams,
  });
  revisions.value = uniqBy([...revisions.value, ...items], 'uid') as Revision[];
  const ids = uniq(
    items.map((it) => (it.state.activityId ?? it.state.id) as number),
  );
  if (ids.length) {
    await activityStore.fetch(repositoryId, { ids, paranoid: false });
  }
  areAllItemsFetched.value = total <= queryParams.offset + queryParams.limit;
  queryParams.offset += queryParams.limit;
  isFetching.value = false;
};

const loadMore = async (options: any) => {
  await fetchRevisions();
  options.done('ok');
};

const scrollerEl = ref<HTMLElement | null>(null);
const { y } = useScroll(scrollerEl);
const isScrolled = computed(() => y.value > 400);
const scrollToTop = () =>
  scrollerEl.value?.scrollTo({ top: 0, behavior: 'smooth' });

onMounted(() => fetchRevisions());
</script>

<style lang="scss" scoped>
.revisions {
  text-align: left;
  // VInfiniteScroll and VList default to overflow:auto, which would trap the
  // sticky headers; clear it so they resolve to the .revisions-page scroller.
  overflow: visible;

  ul {
    overflow: visible;
    list-style-type: none;

    li {
      width: 100%;
    }
  }

  .revision-day-items {
    margin: 0;
    padding: 0.125rem 0 0.25rem;
  }
}

.revision-day-header {
  background: rgb(var(--v-theme-surface-container-low));
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 0.25rem 0.5rem 0.5rem;
  margin-top: 0.75rem;
  margin-left: -0.125rem;
  width: calc(100% + 0.25rem);
}

.revisions-page {
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.back-to-top {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 5;
}
</style>
