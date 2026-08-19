<template>
  <div
    v-if="isEnabled && total > 1"
    class="activity-pagination d-flex align-center ga-1"
  >
    <VBtn
      :aria-label="previousLabel"
      :disabled="!previous"
      :to="previous ? getRoute(previous) : undefined"
      aria-keyshortcuts="Alt+ArrowUp"
      data-testid="editor-pagination-previous"
      density="comfortable"
      icon
    >
      <VIcon icon="mdi-chevron-up" size="small" />
      <VTooltip :offset="12" activator="parent" location="bottom">
        <span class="d-flex align-center ga-2">
          {{ previousLabel }}
          <VHotkey
            :theme="tooltipTheme"
            keys="alt+arrowup"
            variant="text"
            inline
          />
        </span>
      </VTooltip>
    </VBtn>
    <VBtn
      :aria-label="nextLabel"
      :disabled="!next"
      :to="next ? getRoute(next) : undefined"
      aria-keyshortcuts="Alt+ArrowDown"
      data-testid="editor-pagination-next"
      density="comfortable"
      icon
    >
      <VIcon icon="mdi-chevron-down" size="small" />
      <VTooltip :offset="12" activator="parent" location="bottom">
        <span class="d-flex align-center ga-2">
          {{ nextLabel }}
          <VHotkey
            :theme="tooltipTheme"
            keys="alt+arrowdown"
            variant="text"
            inline
          />
        </span>
      </VTooltip>
    </VBtn>
  </div>
</template>

<script lang="ts" setup>
import { useTheme } from 'vuetify';

import type { StoreActivity } from '@/stores/activity';

const theme = useTheme();
const { getActivityName } = useActivityName();
const { isEnabled, sequence, previous, next, getRoute } = useEditorPagination();

const total = computed(() => sequence.value.length);
// Tooltips paint on the inverse surface; keys need the opposite theme.
const tooltipTheme = computed(() =>
  theme.global.current.value.dark ? 'light' : 'dark',
);

const getLabel = (direction: string, activity: StoreActivity | null) => {
  if (!activity) return `No ${direction.toLowerCase()} activity`;
  return `${direction}: ${getActivityName(activity)}`;
};

const previousLabel = computed(() => getLabel('Previous', previous.value));
const nextLabel = computed(() => getLabel('Next', next.value));
</script>

<style lang="scss" scoped>
.v-btn--disabled {
  opacity: 0.35;
}
</style>
