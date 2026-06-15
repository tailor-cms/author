<template>
  <VNavigationDrawer
    v-model="isOpen"
    :class="{ resizing: isResizing }"
    :mobile-breakpoint="LENS_OVERLAY_BELOW_WIDTH"
    :width="width"
    class="sidebar"
    color="surface-container"
    elevation="0"
    location="right"
    border="l"
    disable-route-watcher
  >
    <div
      aria-orientation="vertical"
      class="resize-handle"
      role="separator"
      @pointerdown="startResize"
    />
    <div class="sidebar-layout">
      <div class="sidebar-header px-4 py-3">
        <div class="d-flex align-center">
          <RubricPicker
            :model-value="reviewStore.selectedRubricId"
            :rubrics="reviewStore.rubrics"
            @update:model-value="reviewStore.selectRubric($event)"
          />
          <VSpacer />
          <VBtn
            v-tooltip:bottom="{ text: 'Refresh analysis', openDelay: 500 }"
            :disabled="reviewStore.isRunning"
            aria-label="Refresh analysis"
            density="comfortable"
            icon="mdi-refresh"
            size="small"
            variant="text"
            @click="reviewStore.requestAnalysis(true)"
          />
          <VBtn
            v-tooltip:bottom="{ text: 'Collapse sidebar', openDelay: 500 }"
            aria-label="Collapse sidebar"
            class="sidebar-collapse-btn"
            density="comfortable"
            icon="mdi-chevron-double-right"
            size="small"
            variant="text"
            @click="isOpen = false"
          />
        </div>
        <AnalysisStatus
          :computed-at="result?.computedAt"
          :is-running="reviewStore.isRunning"
          :is-stale="status?.isStale ?? false"
          class="mt-1"
        />
      </div>
      <VDivider />
      <div class="sidebar-body pa-4 d-flex flex-column ga-3">
        <VAlert
          v-if="status?.status === 'failed'"
          color="error"
          density="compact"
          icon="mdi-alert-circle-outline"
          variant="tonal"
        >
          <span class="text-body-small">
            The last analysis failed. Refresh to try again.
          </span>
        </VAlert>
        <div
          v-if="reviewStore.isRunning"
          class="placeholder d-flex flex-column align-center ga-4 pa-6"
        >
          <VProgressCircular color="tertiary" size="48" width="3" indeterminate />
          <div class="text-body-small text-medium-emphasis text-center">
            Reading the content through the
            {{ reviewStore.selectedRubric?.name }} lens. This
            usually takes under a minute.
          </div>
        </div>
        <template v-else-if="result">
          <ScoreOverview
            :dimensions="dimensions"
            :result="result"
            :trend="status?.trend ?? []"
          />
          <template v-if="result.strengths.length">
            <div class="section-title">What's working</div>
            <StrengthsList :strengths="result.strengths" />
          </template>
          <template v-if="result.suggestions.length">
            <div class="section-title">Suggestions</div>
            <div class="d-flex flex-column ga-2">
              <SuggestionCard
                v-for="(suggestion, index) in sortedSuggestions"
                :key="index"
                :dimensions="dimensions"
                :has-target-element="hasTargetElement(suggestion)"
                :is-agent-available="config.isAiAvailable"
                :suggestion="suggestion"
                @agent:ask="askAgent"
                @element:show="showElement"
              />
            </div>
          </template>
          <div class="section-title">Score breakdown</div>
          <VExpansionPanels class="dimension-panels pb-4" multiple flat>
            <DimensionCard
              v-for="dimension in dimensions"
              :key="dimension.key"
              :assessment="assessmentByKey[dimension.key]"
              :dimension="dimension"
            />
          </VExpansionPanels>
        </template>
        <div
          v-else
          class="placeholder d-flex flex-column align-center ga-4 pa-6"
        >
          <VIcon
            class="placeholder-icon"
            icon="mdi-creation"
            size="48"
          />
          <div class="text-body-small text-medium-emphasis text-center">
            Get feedback on this content - engagement scoring, what
            works, and what to improve.
          </div>
          <VBtn
            color="tertiary"
            prepend-icon="mdi-creation"
            text="Analyze content"
            variant="tonal"
            @click="reviewStore.requestAnalysis()"
          />
        </div>
      </div>
    </div>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import type { FeedbackSuggestion } from '@tailor-cms/interfaces/feedback';
import { getElementId } from '@tailor-cms/utils';
import { useDisplay } from 'vuetify';

import AnalysisStatus from './AnalysisStatus.vue';
import DimensionCard from './DimensionCard.vue';
import RubricPicker from './RubricPicker.vue';
import ScoreOverview from './ScoreOverview.vue';
import StrengthsList from './StrengthsList.vue';
import SuggestionCard from './SuggestionCard.vue';
import { useConfigStore } from '@/stores/config';
import { useContentElementStore } from '@/stores/content-elements';
import { LENS_OVERLAY_BELOW_WIDTH, useReviewStore } from '@/stores/review';

const IMPACT_ORDER = { high: 0, medium: 1, low: 2 } as const;

const { $eventBus } = useNuxtApp() as any;
const { xlAndUp } = useDisplay();

// Default v-model (the prop's wire name stays `modelValue` per Vue's
// contract); locally named for readability.
const isOpen = defineModel<boolean>();

const { width, isResizing, startResize } = useDrawerResize({
  side: 'right',
  storageKey: 'editor:review-sidebar:width',
  defaultWidth: () => (xlAndUp.value ? 480 : 380),
});

const config = useConfigStore();
const elementStore = useContentElementStore();
const reviewStore = useReviewStore();

const status = computed(() => reviewStore.status);
const result = computed(() => status.value?.result ?? null);
const dimensions = computed(
  () => reviewStore.selectedRubric?.dimensions ?? [],
);

const assessmentByKey = computed(() =>
  Object.fromEntries(
    (result.value?.dimensions ?? []).map((it) => [it.key, it]),
  ),
);

const sortedSuggestions = computed(() =>
  [...(result.value?.suggestions ?? [])].sort(
    (a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact],
  ),
);

const findElement = (elementId?: number | null) =>
  elementId ? elementStore.items.find((it) => it.id === elementId) : undefined;

const hasTargetElement = (suggestion: FeedbackSuggestion) =>
  !!findElement(suggestion.targetElementId);

/**
 * Focus the suggested element through the editor channel (the same
 * select event the editor uses) and scroll it into view once the
 * focused styling lands.
 */
const showElement = (elementId: number) => {
  const element = findElement(elementId);
  if (!element) return;
  $eventBus
    .channel('editor')
    .emit('element:select', { elementId: getElementId(element as any) });
  setTimeout(() => {
    document
      .querySelector('.content-element.focused')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
};

const askAgent = (prompt: string) => {
  $eventBus.channel('agent').emit('prompt:set', { prompt });
};
</script>

<style lang="scss" scoped>
.sidebar {
  text-align: left;

  // Suppress the drawer's width animation while dragging the handle so
  // the edge tracks the pointer instead of easing behind it.
  &.resizing {
    transition-duration: 0s !important;
  }

  // The header stays pinned; only .sidebar-body scrolls.
  :deep(.v-navigation-drawer__content) {
    overflow: hidden;
  }
}

.sidebar-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  flex-shrink: 0;
}

.sidebar-body {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.sidebar-collapse-btn {
  opacity: 0.7;
  transition: opacity 160ms ease;

  &:hover {
    opacity: 1;
  }
}

.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 0.3125rem;
  z-index: 100;
  cursor: col-resize;
  touch-action: none;

  &:hover,
  &:active {
    background: rgba(var(--v-theme-primary), 0.25);
  }
}

.sidebar-container {
  min-height: 100%;
}

.section-title {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.7;
}

.dimension-panels :deep(.v-expansion-panel) {
  margin-top: 0.5rem !important;
  border-radius: 12px !important;

  &::after {
    display: none;
  }

  &:first-child {
    margin-top: 0 !important;
  }
}

.placeholder {
  margin-top: 30%;
}

.placeholder-icon {
  opacity: 0.4;
}
</style>
