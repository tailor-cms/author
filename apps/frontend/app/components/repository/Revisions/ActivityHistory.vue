<template>
  <div class="activity-history pa-2">
    <div v-if="isFetching && !revisions.length" class="text-center pa-6">
      <VProgressCircular indeterminate />
    </div>
    <VAlert
      v-else-if="!bundledRevisions.length"
      class="ma-2"
      color="primary"
      icon="mdi-history"
      text="No changes recorded for this activity yet."
      variant="tonal"
      prominent
    />
    <template v-else>
      <VList
        v-model:opened="openedBundleUids"
        density="compact"
        bg-color="transparent"
        class="pa-0"
        nav
      >
        <template v-for="group in groupedRevisions" :key="group.key">
          <VListSubheader class="text-label-medium text-uppercase">
            {{ group.label }}
          </VListSubheader>
          <template v-for="bundle in group.items" :key="bundle.uid">
            <VListGroup
              v-if="bundle.children.length > 0"
              :value="bundle.uid"
            >
              <template #activator>
                <HistoryListItem
                  :change-count="bundle.children.length"
                  :children-count="bundle.children.length"
                  :is-active="isPreviewed(bundle)"
                  :is-expanded="openedBundleUids.includes(bundle.uid)"
                  :is-published="bundle.uid === publishedRevisionUid"
                  :is-restore="bundle.isRestore"
                  :revision="bundle"
                  @select="previewRevision(bundle)"
                  @toggle-expand="toggleExpand(bundle.uid)"
                />
              </template>
              <HistoryListItem
                v-for="child in bundle.children"
                :key="child.uid"
                :is-active="isPreviewed(child)"
                :is-nested="true"
                :is-published="child.uid === publishedRevisionUid"
                :revision="child"
                @select="previewRevision(child)"
              />
            </VListGroup>
            <HistoryListItem
              v-else
              :change-count="1"
              :is-active="isPreviewed(bundle)"
              :is-published="bundle.uid === publishedRevisionUid"
              :is-restore="bundle.isRestore"
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
import { last, map, uniqBy } from 'lodash-es';
import { formatDate, useIntersectionObserver } from '@vueuse/core';
import { isToday } from 'date-fns/isToday';
import { isYesterday } from 'date-fns/isYesterday';
import { Revision as RevisionEvents } from '@tailor-cms/common/src/sse.js';
import { Entity } from '@tailor-cms/interfaces/revision';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { Revision } from '@tailor-cms/interfaces/revision';

import HistoryListItem from './HistoryListItem.vue';
import { api } from '@/api';
import { isSameInstance } from '@/lib/revision';
import sseRepositoryFeed from '@/lib/RepositoryFeed';
import { useActivityStore } from '@/stores/activity';
import { useEditorStore } from '@/stores/editor';

const props = defineProps<{ activity: Activity }>();

const editorStore = useEditorStore();
const activityStore = useActivityStore();

interface BundledRevision extends Revision {
  // Absorbed revisions: older same-run edits, or the rest of a restore cascade.
  children: Revision[];
  // True when this entry stands for a whole restore (shared `transactionId`).
  isRestore?: boolean;
}

const isFetching = ref(false);
const revisions = ref<Revision[]>([]);
const queryParams = reactive({ offset: 0, limit: 50 });
const areAllItemsFetched = ref(false);
// Expanded bundle uids, managed here (not via VListGroup's activator) so our
// chevron toggles expansion without triggering a preview.
const openedBundleUids = ref<string[]>([]);

// Two grouping passes over the DESC list: revisions sharing a `transactionId`
// (a restore) collapse into one "Restored…" entry; otherwise consecutive
// same-instance/same-operation edits collapse into a run. The transactionId is
// a hard boundary - a manual edit never merges into a restore.
const bundledRevisions = computed<BundledRevision[]>(() => {
  if (!revisions.value.length) return [];
  const result: BundledRevision[] = [];
  for (const it of revisions.value) {
    const prev = last(result);
    if (it.transactionId) {
      if (prev?.isRestore && prev.transactionId === it.transactionId) {
        prev.children.push(it);
      } else {
        // Keep the member as a child too, so every change in the restore stays
        // visible; the wrapper borrows its identity for keying/preview.
        result.push({ ...it, children: [it], isRestore: true });
      }
      continue;
    }
    const sameRun =
      prev &&
      !prev.isRestore &&
      !prev.transactionId &&
      isSameInstance(prev, it) &&
      prev.operation === it.operation;
    if (sameRun) {
      (prev as BundledRevision).children.push(it);
    } else {
      result.push({ ...it, children: [] });
    }
  }
  return result;
});

const dayLabel = (date: Date) => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return formatDate(date, 'MMMM Do, YYYY');
};

interface RevisionDayGroup {
  key: string;
  label: string;
  items: BundledRevision[];
}

// Group bundles by calendar day; one linear pass works because the list is DESC.
const groupedRevisions = computed<RevisionDayGroup[]>(() => {
  const groups: RevisionDayGroup[] = [];
  for (const bundle of bundledRevisions.value) {
    const date = new Date(bundle.createdAt);
    const key = formatDate(date, 'YYYY-MM-DD');
    const current = last(groups);
    if (current?.key === key) {
      current.items.push(bundle);
    } else {
      groups.push({ key, label: dayLabel(date), items: [bundle] });
    }
  }
  return groups;
});

const toggleExpand = (uid: string) => {
  const idx = openedBundleUids.value.indexOf(uid);
  if (idx >= 0) openedBundleUids.value.splice(idx, 1);
  else openedBundleUids.value.push(uid);
};

// The bundle that was shipped: the newest revision at or before
// `activity.publishedAt`. Null if never published (DESC list -> first match).
const publishedRevisionUid = computed<string | null>(() => {
  const publishedAt = props.activity.publishedAt;
  if (!publishedAt) return null;
  const cutoff = new Date(publishedAt).getTime();
  const match = bundledRevisions.value.find(
    (r) => new Date(r.createdAt).getTime() <= cutoff,
  );
  return match?.uid ?? null;
});

const isPreviewed = (revision: Revision) =>
  editorStore.historyRevision?.uid === revision.uid;

const previewRevision = (revision: Revision) => {
  if (isPreviewed(revision)) {
    editorStore.exitHistoryMode();
    return;
  }
  // Baseline = the preceding revision from the raw (un-bundled) DESC list, so
  // bundle parents and absorbed children both diff correctly.
  const idx = revisions.value.findIndex((r) => r.uid === revision.uid);
  const previous = idx >= 0 ? revisions.value[idx + 1] ?? null : null;
  editorStore.enterHistoryMode(revision, previous);
};

const fetchRevisions = async () => {
  if (isFetching.value || !props.activity?.id) return;
  isFetching.value = true;
  try {
    const { items, total }: { items: Revision[]; total: number } =
      await api.revision.list({
        params: { repositoryId: props.activity.repositoryId },
        query: {
          activityId: props.activity.id,
          ...queryParams,
        },
      });
    revisions.value = uniqBy([...revisions.value, ...items], 'uid');
    areAllItemsFetched.value =
      total <= queryParams.offset + queryParams.limit;
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

// Infinite scroll: fetch the next page when the sentinel scrolls into view.
const loadMoreEl = ref<HTMLElement | null>(null);
useIntersectionObserver(loadMoreEl, ([entry]) => {
  if (entry?.isIntersecting) fetchRevisions();
});

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
</style>
