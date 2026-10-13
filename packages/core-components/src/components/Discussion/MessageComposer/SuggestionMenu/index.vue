<template>
  <VCard
    :max-width="WIDTH"
    :style="position"
    class="suggestion-menu overflow-y-auto"
    elevation="8"
    min-width="240"
    rounded="lg"
  >
    <VList v-if="items.length" density="compact" nav>
      <VListItem
        v-for="(item, index) in items"
        :key="item.value"
        :active="index === selectedIndex"
        :prepend-avatar="item.avatar"
        :prepend-icon="iconOf(item)"
        :subtitle="item.subtitle"
        :title="item.label"
        rounded="lg"
        @click="emit('select', item)"
      />
    </VList>
    <div v-else class="px-4 py-3 text-body-small text-medium-emphasis">
      No matches
    </div>
  </VCard>
</template>

<script lang="ts" setup>
import type { SuggestionItem } from '../../types';

import { computed } from 'vue';
import { referenceIcon } from '../../referenceIcon';

const WIDTH = 360;
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 256;
// From the caret
const GAP = 6;
// From the viewport edges
const MARGIN = 8;
// Above Vuetify overlays
const Z_INDEX = 2500;

export interface Box {
  left: number;
  top: number;
  bottom: number;
}

const props = defineProps<{
  items: SuggestionItem[];
  selectedIndex: number;
  caret: Box | null;
  // The overlay the menu is placed in; null for the viewport
  origin: Box | null;
}>();

const emit = defineEmits<{ select: [item: SuggestionItem] }>();

const iconOf = ({ avatar, icon, entityType }: SuggestionItem) => {
  if (avatar) return undefined;
  return icon ?? (entityType ? referenceIcon(entityType) : undefined);
};

/**
 * Next to the caret: below it, or above when there is no room below.
 * Kept inside the viewport.
 */
const position = computed(() => {
  const { caret } = props;
  if (!caret) return { display: 'none' };
  const origin = props.origin ?? {
    left: 0,
    top: 0,
    bottom: window.innerHeight,
  };
  const spaceBelow = window.innerHeight - caret.bottom;
  const isAbove = spaceBelow < MAX_HEIGHT + GAP + MARGIN;
  const space = (isAbove ? caret.top : spaceBelow) - GAP - MARGIN;
  const left = Math.max(
    MARGIN,
    Math.min(caret.left, window.innerWidth - WIDTH - MARGIN),
  );
  return {
    position: 'fixed' as const,
    left: `${left - origin.left}px`,
    ...(isAbove
      ? { bottom: `${origin.bottom - caret.top + GAP}px` }
      : { top: `${caret.bottom + GAP - origin.top}px` }),
    maxHeight: `${Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, space))}px`,
    zIndex: Z_INDEX,
  };
});
</script>
