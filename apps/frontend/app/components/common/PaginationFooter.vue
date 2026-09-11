<template>
  <div
    v-if="itemsCount"
    class="d-flex align-center justify-space-between mt-2 px-1"
  >
    <span class="text-body-medium">{{ rangeLabel }}</span>
    <VPagination
      v-if="pageCount > 1"
      v-model="page"
      :length="pageCount"
      :total-visible="7"
      density="comfortable"
      rounded
    />
  </div>
</template>

<script lang="ts" setup>
import pluralize from 'pluralize-esm';

const props = defineProps<{
  pageCount: number;
  itemsCount: number;
  itemsPerPage: number;
  itemLabel?: string;
}>();

const page = defineModel<number>('page', { required: true });

const rangeLabel = computed(() => {
  const from = (page.value - 1) * props.itemsPerPage + 1;
  const to = Math.min(page.value * props.itemsPerPage, props.itemsCount);
  const noun = props.itemLabel
    ? ` ${pluralize(props.itemLabel, props.itemsCount)}`
    : '';
  return `Showing ${from}–${to} of ${props.itemsCount}${noun}`;
});
</script>
