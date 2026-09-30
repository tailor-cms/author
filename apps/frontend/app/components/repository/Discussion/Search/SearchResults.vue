<template>
  <div ref="resultsEl" class="search-results overflow-y-auto">
    <VList
      v-if="groups.length"
      bg-color="transparent"
      class="d-flex flex-column ga-3 py-3"
    >
      <div v-for="group in groups" :key="group.threadId" class="result-group">
        <VListItem
          :prepend-icon="group.icon"
          class="result-group-header px-4"
          min-height="40"
          prepend-gap="24"
          @click="emit('select', group.threadId)"
        >
          <template #title>
            <span class="text-title-small">{{ group.label }}</span>
          </template>
          <template #append>
            <span class="text-body-small text-medium-emphasis">
              {{ pluralize('match', group.hits.length, true) }}
            </span>
          </template>
        </VListItem>
        <ResultHit
          v-for="hit in group.hits"
          :key="hit.id"
          :current-user-id="currentUserId"
          :hit="hit"
          @click="emit('select', group.threadId)"
        />
      </div>
    </VList>
    <TailorEmptyState
      v-else-if="!isSearching"
      class="mt-6"
      height="auto"
      icon="mdi-magnify-close"
      size="48"
      text="Nothing in this repository matches that search."
      text-width="320"
      title="No matches"
      variant="text"
    />
  </div>
</template>

<script lang="ts" setup>
import type { SearchHit } from '@/stores/discussion';
import type { ThreadAnchor } from '../composables/useThreadAnchor';

import { TailorEmptyState } from '@tailor-cms/core-components';
import { extractText } from '@tailor-cms/utils';
import { useThreadAnchors } from '../composables/useThreadAnchor';
import ResultHit from './ResultHit.vue';
import pluralize from 'pluralize-esm';

interface Props {
  hits: SearchHit[];
  query: string;
  isSearching?: boolean;
  currentUserId?: number | null;
}

interface HitGroup extends ThreadAnchor {
  threadId: number;
  hits: SearchHit[];
}

const props = withDefaults(defineProps<Props>(), {
  isSearching: false,
  currentUserId: null,
});

const emit = defineEmits<{ select: [threadId: number] }>();

const { anchorOf } = useThreadAnchors();

// Grouped by thread in ranked order
const groups = computed(() => {
  const byThread = new Map<number, HitGroup>();
  props.hits.forEach((hit) => {
    if (!hit.thread) return;
    const threadId = hit.thread.id;
    if (!byThread.has(threadId)) {
      byThread.set(threadId, { ...anchorOf(hit.thread), threadId, hits: [] });
    }
    byThread.get(threadId)!.hits.push(hit);
  });
  return [...byThread.values()];
});

const resultsEl = ref<HTMLElement | null>(null);
const terms = computed(() => parseSearchTerms(extractText(props.query)));

useSearchHighlight(resultsEl, terms);
</script>

<style lang="scss" scoped>
.result-group-header {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
