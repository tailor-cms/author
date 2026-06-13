<template>
  <VCard
    :class="{ selected: isSelected }"
    class="search-result d-flex align-start ga-3 px-3 py-3"
    color="surface-container-low"
    variant="flat"
    @click="$emit('toggle')"
  >
    <VCheckboxBtn
      :model-value="isSelected"
      class="flex-grow-0 align-self-center"
      color="primary"
      density="compact"
      @click.stop="$emit('toggle')"
    />
    <VAvatar
      class="align-self-center mr-1"
      rounded="lg"
      size="53"
      variant="tonal"
    >
      <VImg
        v-if="suggestion.thumbnailUrl"
        :src="suggestion.thumbnailUrl ?? ''"
        cover
      />
      <VIcon
        v-else
        :color="typeColor"
        :icon="typeIcon"
        size="24"
      />
    </VAvatar>
    <Body :suggestion="suggestion" :color="typeColor" :icon="typeIcon" />
    <VBtn
      :href="suggestion.url"
      icon="mdi-open-in-new"
      size="small"
      target="_blank"
      variant="text"
      @click.stop
    />
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
  border-radius: 8px;
  transition: background 0.15s ease;

  &:hover {
    background-color: rgb(var(--v-theme-surface-container));
  }

  &.selected {
    background: rgb(var(--v-theme-surface-container));
  }
}
</style>
