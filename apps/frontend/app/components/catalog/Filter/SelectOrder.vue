<template>
  <span>
    <VMenu offset="10">
      <template #activator="{ props: menuProps }">
        <VBtn
          v-tooltip:top="{ text: 'Order by', openDelay: 500 }"
          v-bind="menuProps"
          aria-label="Order by"
          class="text-medium-emphasis my-1"
          icon="mdi-sort-variant"
          size="small"
          variant="text"
        />
      </template>
      <VList class="py-0">
        <VListItem
          v-for="{ text, field, direction } in options"
          :key="field"
          :active="sortBy.field === field"
          :title="text"
          @click="update({ field, direction })"
        />
      </VList>
    </VMenu>
    <VBtn
      v-tooltip:top="{ text: 'Order direction', openDelay: 500 }"
      :icon="sortIcon"
      aria-label="Order direction"
      class="text-medium-emphasis my-1"
      size="small"
      variant="text"
      @click="toggleOrder"
    />
  </span>
</template>

<script lang="ts" setup>
export interface SortBy { field: string; direction: string };

const props = withDefaults(defineProps<{ sortBy?: SortBy }>(), {
  sortBy: () => ({ field: 'createdAt', direction: 'DESC' }),
});

const emit = defineEmits(['update']);

const sortIcon = computed(() =>
  props.sortBy?.direction === 'ASC'
    ? 'mdi-sort-ascending'
    : 'mdi-sort-descending',
);

const options = computed(() => [
  { text: 'Creation date', field: 'createdAt', direction: 'DESC' },
  { text: 'Name', field: 'name', direction: 'ASC' },
]);

const update = (sortOption: { field: string; direction: string }) => {
  emit('update', sortOption);
};

const toggleOrder = () => {
  const direction = props.sortBy.direction === 'ASC' ? 'DESC' : 'ASC';
  update({ ...props.sortBy, direction });
};
</script>
