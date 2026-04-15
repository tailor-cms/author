<template>
  <VCard
    :class="{ selected: isSelected }"
    class="search-result"
    variant="outlined"
    @click="$emit('toggle')"
  >
    <div class="d-flex align-start pa-3 ga-3">
      <VCheckbox
        :model-value="isSelected"
        class="flex-shrink-0 align-self-center"
        color="primary-lighten-4"
        density="compact"
        hide-details
        @click.stop
        @update:model-value="$emit('toggle')"
      />
      <VAvatar
        v-if="suggestion.thumbnailUrl"
        class="flex-shrink-0"
        rounded="lg"
        size="56"
      >
        <VImg :src="suggestion.thumbnailUrl ?? ''" cover />
      </VAvatar>
      <VIcon
        v-else
        :color="`${typeColor}-lighten-3`"
        :icon="typeIcon"
        class="flex-shrink-0 ma-4"
        size="28"
      />
      <Body :suggestion="suggestion" :color="typeColor" :icon="typeIcon" />
      <VBtn
        :href="suggestion.url"
        color="primary-lighten-2"
        icon="mdi-open-in-new"
        size="x-small"
        target="_blank"
        variant="text"
        @click.stop
      />
    </div>
  </VCard>
</template>

<script lang="ts" setup>
import type { DiscoveryResult } from '@tailor-cms/interfaces/discovery';

import { TYPE_COLOR, TYPE_ICON } from '../../constants';
import Body from './Body.vue';

const props = defineProps<{
  suggestion: DiscoveryResult;
  isSelected: boolean;
}>();

defineEmits<{
  toggle: [];
}>();

const typeIcon = computed(() => TYPE_ICON[props.suggestion.type]);
const typeColor = computed(() => TYPE_COLOR[props.suggestion.type]);
</script>

<style lang="scss" scoped>
.search-result {
  cursor: pointer;
  border-color: rgba(var(--v-theme-primary-lighten-2), 0.2) !important;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    border-color: rgba(var(--v-theme-primary-lighten-2), 0.5) !important;
  }

  &.selected {
    border-color: rgb(var(--v-theme-primary-lighten-3)) !important;
    background: rgba(var(--v-theme-primary-lighten-3), 0.08);
  }
}
</style>
