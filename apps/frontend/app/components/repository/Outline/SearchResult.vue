<template>
  <VListItem
    :ripple="false"
    :active="isSelected"
    class="search-result bg-surface-raised py-3 px-4 mb-2"
    elevation="1"
    link
    rounded
    @click="$emit('select')"
  >
    <VListItemTitle class="search-title d-flex ga-2 align-center font-weight-medium">
      <LabelChip color="inverse-surface" size="x-small" variant="tonal">
        {{ typeLabel }}
      </LabelChip>
      <LabelChip color="secondary" size="x-small" variant="tonal">
        {{ activity.shortId }}
      </LabelChip>
      <ActivityName :activity="activity" class="text-title-medium ml-2" />
    </VListItemTitle>
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
  text-align: left;

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
