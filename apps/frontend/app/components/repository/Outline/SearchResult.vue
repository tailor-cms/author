<template>
  <VListItem
    :class="{ 'is-selected': isSelected }"
    :ripple="false"
    :style="{ '--row-accent': config?.color }"
    class="search-result py-2 px-4 mb-2"
    rounded
    @click="$emit('select')"
  >
    <VListItemTitle class="search-title font-weight-medium">
      <ActivityName :activity="activity" />
    </VListItemTitle>
    <VListItemSubtitle class="search-meta d-flex align-center ga-2 mt-1">
      <LabelChip color="inverse-surface" size="x-small" variant="flat">
        {{ typeLabel }}
      </LabelChip>
      <LabelChip color="secondary" size="x-small" variant="flat">
        {{ activity.shortId }}
      </LabelChip>
    </VListItemSubtitle>
    <template #append>
      <VBtn
        v-tooltip:bottom="'Go to'"
        class="go-to-btn text-medium-emphasis"
        append-icon="mdi-arrow-right"
        color="tertiary"
        text="Go to"
        size="small"
        variant="tonal"
        @mousedown.stop="$emit('show')"
      />
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import { find } from 'lodash-es';

import ActivityName from '@/components/common/ActivityName.vue';
import LabelChip from '@/components/common/LabelChip.vue';
import { useCurrentRepository } from '@/stores/current-repository';

interface Props {
  activity: StoreActivity;
  isSelected?: boolean;
}

const props = withDefaults(defineProps<Props>(), { isSelected: false });
defineEmits(['select', 'show']);

const store = useCurrentRepository();

const config = computed(() =>
  find(store.taxonomy, { type: props.activity.type }),
);
const typeLabel = computed(() => config.value?.label);
</script>

<style lang="scss" scoped>
.search-result {
  background-color: rgba(var(--v-theme-surface-container));
  border-left: 8px solid var(--row-accent);
  text-align: left;
  transition:
    background-color 0.2s cubic-bezier(0.25, 0.8, 0.25, 1),
    border-left-width 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    background-color: rgb(var(--v-theme-surface-container-high));
  }

  &.is-selected {
    background-color: rgb(var(--v-theme-surface-container-high));
    border-left-width: 2.25rem;

    .search-title {
      font-weight: 600 !important;
    }
  }

  .go-to-btn {
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover .go-to-btn,
  &:focus-within .go-to-btn,
  &.is-selected .go-to-btn {
    opacity: 1;
  }
}
</style>
