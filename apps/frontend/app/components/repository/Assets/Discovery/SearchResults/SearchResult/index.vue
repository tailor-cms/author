<template>
  <VCard
    :class="{ selected: isSelected }"
    class="search-result"
    variant="flat"
    border
    @click="$emit('toggle')"
  >
    <div class="d-flex align-start pa-3 ga-3">
      <VCheckbox
        :model-value="isSelected"
        class="flex-shrink-0 align-self-center"
        density="compact"
        hide-details
        @click.stop
        @update:model-value="$emit('toggle')"
      />
      <VAvatar
        v-if="suggestion.thumbnailUrl"
        class="flex-shrink-0 mt-1"
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
        icon="mdi-open-in-new"
        size="small"
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

  &.selected {
    background: rgba(var(--v-theme-surface-container-low), 0.6);
  }
}
</style>
