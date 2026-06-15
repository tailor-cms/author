<template>
  <VDivider class="unseen-divider my-4" content-offset="-16">
    <VChip
      :text="unseenCommentsLabel"
      prepend-icon="mdi-arrow-down"
      close-icon="mdi-close"
      color="secondary"
      size="small"
      variant="tonal"
      closable
      rounded
      @click="seen"
      @click:close="seen"
    />
  </VDivider>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import pluralize from 'pluralize-esm';

const props = defineProps<{ count: number }>();
const emit = defineEmits(['seen']);

const unseenCommentsLabel = computed(
  () => `${props.count} new ${pluralize('message', props.count, false)}`,
);

const seen = () => emit('seen');
</script>
