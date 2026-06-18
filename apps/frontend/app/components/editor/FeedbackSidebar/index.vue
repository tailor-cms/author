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
    disable-route-watcher
  >
    <div
      aria-orientation="vertical"
      class="resize-handle"
      role="separator"
      @pointerdown="startResize"
    />
    <div class="sidebar-layout">
      <div class="sidebar-header pa-4">
        <div class="d-flex align-center mb-3">
          <span class="text-title-medium font-weight-bold">
            Review lens
          </span>
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
            class="ml-2"
            density="comfortable"
            icon="mdi-chevron-double-right"
            size="small"
            variant="tonal"
            @click="isOpen = false"
          />
        </div>
        <RubricPicker
          :model-value="reviewStore.selectedRubricId"
          :rubrics="reviewStore.rubrics"
          @update:model-value="reviewStore.selectRubric($event)"
        />
        <AnalysisStatus
          :computed-at="result?.computedAt"
          :is-running="reviewStore.isRunning"
          :is-stale="status?.isStale ?? false"
          class="mt-3 mx-1"
        />
      </div>
      <div class="sidebar-body px-4 d-flex flex-column ga-3">
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
          class="d-flex flex-column align-center ga-4 pa-6 mt-8"
        >
          <VProgressCircular color="tertiary" size="54" width="5" indeterminate />
          <div class="text-title-small text-medium-emphasis text-center mt-4">
            Reading the content through the <br />
            <span class="font-weight-bold text-tertiary">
              {{ reviewStore.selectedRubric?.name }}
            </span> lens.<br />
            This usually takes under a minute.
          </div>
        </div>
        <template v-else-if="result">
          <ScoreOverview
            :dimensions="dimensions"
            :result="result"
            :trend="status?.trend ?? []"
          />
          <template v-if="result.strengths.length">
            <div class="text-label-medium font-weight-bold mt-2">What's working</div>
            <StrengthsList :strengths="result.strengths" />
          </template>
          <template v-if="result.suggestions.length">
            <div class="text-label-medium font-weight-bold mt-2">Suggestions</div>
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
          <div class="text-label-medium font-weight-bold mt-2">Score breakdown</div>
          <VExpansionPanels class="dimension-panels pb-4" multiple flat>
            <DimensionCard
              v-for="dimension in dimensions"
              :key="dimension.key"
              :assessment="assessmentByKey[dimension.key]"
              :dimension="dimension"
            />
          </VExpansionPanels>
        </template>
        <VEmptyState
          v-else
          class="justify-start pt-16"
          color="tertiary"
          icon="mdi-creation"
          size="48"
          title="Review this content"
          text="Get feedback on this content - engagement scoring, what
            works, and what to improve."
        >
          <template #actions>
            <VBtn
              text="Analyze"
              variant="tonal"
              @click="reviewStore.requestAnalysis()"
            />
          </template>
        </VEmptyState>
      </div>
    </div>
  </VNavigationDrawer>
  <VFadeTransition>
    <VBtn
      v-if="!isOpen"
      v-tooltip:left="{ text: 'Open Lens review', openDelay: 500 }"
      aria-label="Open Lens review"
      class="lens-toggle"
      color="tertiary-container"
      density="comfortable"
      icon="mdi-camera-iris"
      size="small"
      @click="isOpen = true"
    />
  </VFadeTransition>
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
const { width: viewportWidth, xlAndUp } = useDisplay();

// Default v-model (the prop's wire name stays `modelValue` per Vue's
// contract); locally named for readability.
const isOpen = defineModel<boolean>();

// On overlay-width viewports the drawer is temporary; mount it closed so it
// never covers the editor. Desktop keeps the persisted preference, and
// Vuetify's resize-watcher handles later breakpoint crossings.
onMounted(() => {
  if (viewportWidth.value < LENS_OVERLAY_BELOW_WIDTH) isOpen.value = false;
});

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
.lens-toggle {
  position: absolute;
  width: 1.5rem;
  height: 3.5rem;
  top: 5.5rem;
  right: 0;
  border-radius: 12px 0 0 12px;
}

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

.dimension-panels :deep(.v-expansion-panel) {
  margin-top: 0.5rem;
  border-radius: 0.5rem;

  &::after {
    display: none;
  }

  &:first-child {
    margin-top: 0;
  }
}
</style>
