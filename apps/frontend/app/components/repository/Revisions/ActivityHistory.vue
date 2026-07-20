<template>
  <div class="activity-history pa-2">
    <div v-if="isFetching && !revisions.length" class="text-center pa-6">
      <VProgressCircular indeterminate />
    </div>
    <TailorEmptyState
      v-else-if="!bundledRevisions.length"
      icon="mdi-history"
      size="48"
      text="No changes have been recorded for this activity yet."
      title="No history yet"
      variant="text"
    />
    <template v-else>
      <VList
        color="tertiary"
        density="compact"
        bg-color="transparent"
        class="history-list pa-0"
        nav
      >
        <template v-for="group in groupedRevisions" :key="group.key">
          <VListSubheader
            class="history-day-header text-label-medium text-uppercase"
          >
            {{ group.label }}
          </VListSubheader>
          <template v-for="bundle in group.items" :key="bundle.uid">
            <VListGroup v-if="bundle.children.length > 0" :value="bundle.uid">
              <template #activator="{ props: activatorProps, isOpen }">
                <HistoryListItem
                  :activator-props="activatorProps"
                  :children-count="bundle.children.length"
                  :is-active="isPreviewed(bundle)"
                  :is-expanded="isOpen"
                  :is-published="bundle.uid === publishedRevision?.uid"
                  :revision="bundle"
                  @select="previewRevision(bundle)"
                />
              </template>
              <HistoryListItem
                v-for="child in bundle.children"
                :key="child.uid"
                :is-active="isPreviewed(child)"
                :revision="child"
                :selectable="!bundle.isRestore"
                @select="previewRevision(child)"
              />
            </VListGroup>
            <HistoryListItem
              v-else
              :is-active="isPreviewed(bundle)"
              :is-published="bundle.uid === publishedRevision?.uid"
              :revision="bundle"
              @select="previewRevision(bundle)"
            />
          </template>
        </template>
      </VList>
      <div
        v-if="!areAllItemsFetched"
        ref="loadMoreEl"
        class="d-flex justify-center py-3"
      >
        <VProgressCircular v-if="isFetching" size="24" indeterminate />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { findIndex, findLastIndex, last, map, uniqBy } from 'lodash-es';
import { useIntersectionObserver } from '@vueuse/core';
import { Revision as RevisionEvents } from '@tailor-cms/common/src/sse.js';
import { Entity } from '@tailor-cms/interfaces/revision';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { Revision } from '@tailor-cms/interfaces/revision';

import { TailorEmptyState } from '@tailor-cms/core-components';

import HistoryListItem from './HistoryListItem.vue';
import { api } from '@/api';
import { groupByDay, isSameRun, type HistoryEntry } from '@/lib/revision';
import sseRepositoryFeed from '@/lib/RepositoryFeed';
import { useActivityStore } from '@/stores/activity';
import { useEditorStore } from '@/stores/editor';

type BundledRevision = HistoryEntry & { children: Revision[] };

const props = defineProps<{ activity: Activity }>();

const isFetching = ref(false);
const revisions = ref<Revision[]>([]);
const queryParams = reactive({ offset: 0, limit: 50 });
const areAllItemsFetched = ref(false);
const loadMoreEl = ref<HTMLElement | null>(null);

const editorStore = useEditorStore();
const activityStore = useActivityStore();
useIntersectionObserver(loadMoreEl, ([entry]) => {
  if (entry?.isIntersecting) fetchRevisions();
});

const bundledRevisions = computed<BundledRevision[]>(() => {
  const result: BundledRevision[] = [];
  for (const revision of revisions.value) {
    const previous = last(result);
    // Restore members group by transactionId.
    if (revision.transactionId) {
      const isSameTransaction = previous?.transactionId === revision.transactionId;
      if (previous?.isRestore && isSameTransaction) previous.children.push(revision);
      else result.push({
        isRestore: true,
        uid: `restore:${revision.transactionId}`,
        createdAt: revision.createdAt,
        user: revision.user,
        transactionId: revision.transactionId,
        children: [revision],
      });
      continue;
    }
    // Normal edits group into runs of the same entity + operation.
    if (previous && !previous.isRestore && isSameRun(previous, revision))
      previous.children.push(revision);
    else result.push({ ...revision, children: [] });
  }
  return result;
});

const groupedRevisions = computed(() => groupByDay(bundledRevisions.value));

const publishedRevision = computed<BundledRevision | undefined>(() => {
  const { publishedAt } = props.activity;
  if (!publishedAt) return;
  return bundledRevisions.value.find(({ createdAt }) => createdAt <= publishedAt);
});

const isPreviewed = (revision: HistoryEntry) =>
  editorStore.historyRevision?.uid === revision.uid;

const previewRevision = (revision: HistoryEntry) => {
  if (isPreviewed(revision)) return editorStore.exitHistoryMode();
  const { uid, transactionId } = revision;
  // Diff baseline = the next-older revision. For a restore, anchor on the
  // cascade's last (oldest) member so the baseline precedes the whole restore.
  const index = transactionId
    ? findLastIndex(revisions.value, { transactionId })
    : findIndex(revisions.value, { uid });
  const previousRevision = index >= 0 ? revisions.value[index + 1] ?? null : null;
  editorStore.enterHistoryMode(revision, previousRevision);
};

const fetchRevisions = async () => {
  if (isFetching.value || !props.activity?.id) return;
  isFetching.value = true;
  try {
    const { items, total }: { items: Revision[]; total: number } =
      await api.revision.list({
        params: { repositoryId: props.activity.repositoryId },
        query: { activityId: props.activity.id, ...queryParams },
      });
    revisions.value = uniqBy([...revisions.value, ...items], 'uid');
    areAllItemsFetched.value = total <= queryParams.offset + queryParams.limit;
    queryParams.offset += queryParams.limit;
  } finally {
    isFetching.value = false;
  }
};

const reset = () => {
  revisions.value = [];
  queryParams.offset = 0;
  areAllItemsFetched.value = false;
};

watch(
  () => props.activity?.id,
  () => {
    reset();
    fetchRevisions();
    editorStore.exitHistoryMode();
  },
  { immediate: true },
);

const descendantIds = computed(
  () => new Set(map(activityStore.getDescendants(props.activity.id), 'id')),
);

const isInSubtree = ({ entity, state }: Revision): boolean => {
  if (entity === Entity.Repository) return false;
  const activityId = entity === Entity.ContentElement ? state.activityId : state.id;
  if (activityId === props.activity.id) return true;
  return descendantIds.value.has(activityId as number);
};

const onRevision = (revision: Revision) => {
  if (!isInSubtree(revision)) return;
  revisions.value = uniqBy([revision, ...revisions.value], 'uid');
};

onMounted(() => sseRepositoryFeed.subscribe(RevisionEvents.Create, onRevision));
onBeforeUnmount(() =>
  sseRepositoryFeed.unsubscribe(RevisionEvents.Create, onRevision),
);
</script>

<style lang="scss" scoped>
.activity-history {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

// VList defaults to overflow:auto, which would trap the sticky day headers;
// clear it so they resolve to the scrolling .sidebar-content.
.history-list {
  overflow: visible;
}

.history-day-header {
  background: rgb(var(--v-theme-surface-canvas));
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
