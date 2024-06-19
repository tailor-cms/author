<template>
  <div class="unseen-divider">
    <VDivider />
    <VChip
      class="mt-4 mb-1 text-uppercase"
      close-icon="mdi-close"
      color="primary-lighten-3"
      size="small"
      variant="tonal"
      closable
      rounded
      @click="seen"
      @click:close="seen"
    >
      <VIcon class="mr-1" size="16">mdi-arrow-down</VIcon>
      <span class="mr-2">{{ unseenCommentsLabel }}</span>
    </VChip>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import pluralize from 'pluralize';

const props = defineProps({
  count: { type: Number, required: true },
});

const emit = defineEmits(['seen']);

const unseenCommentsLabel = computed(
  () => `${props.count} new ${pluralize('message', props.count, false)}`,
);

const seen = () => emit('seen');
</script>

<style lang="scss" scoped>
.unseen-divider {
  text-align: center;

  .v-divider {
    margin: 1rem 0 0.25rem;
  }

  :deep(.v-chip.v-chip--outlined.v-chip) {
    margin: -1.5rem 0 0.5rem 0;
    border-radius: 1rem !important;
    background-color: #fafafa !important;

    .v-chip__content .v-chip__close {
      margin-top: 0.125rem;
      font-size: 0.75rem !important;
    }
  }
}
</style>
