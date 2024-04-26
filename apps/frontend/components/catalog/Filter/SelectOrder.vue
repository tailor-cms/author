<template>
  <span>
    <VMenu offset="10">
      <template #activator="{ props: menuProps }">
        <VTooltip
          content-class="bg-primary-darken-4"
          location="top"
          open-delay="500"
        >
          <template #activator="{ props: tooltipProps }">
            <VBtn
              v-bind="{ ...menuProps, ...tooltipProps }"
              aria-label="Order by"
              class="my-1"
              color="primary-lighten-2"
              icon="mdi-sort-variant"
              variant="text"
            />
          </template>
          <span>Order by</span>
        </VTooltip>
      </template>
      <VList class="py-0">
        <VListItem
          v-for="{ text, field, direction } in options"
          :key="field"
          :class="{ 'bg-primary-lighten-4': props.sortBy.field === field }"
          @click="update({ field, direction })"
        >
          <VListItemTitle class="pr-3 text-left">{{ text }}</VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
    <VTooltip
      content-class="bg-primary-darken-4"
      location="top"
      open-delay="500"
    >
      <template #activator="{ props: tooltipProps }">
        <VBtn
          v-bind="tooltipProps"
          :icon="`mdi-sort-${
            sortBy?.direction === 'ASC' ? 'ascending' : 'descending'
          }`"
          aria-label="Order direction"
          class="my-1"
          color="primary-lighten-2"
          variant="text"
          @click="toggleOrder"
        />
      </template>
      <span>Order direction</span>
    </VTooltip>
  </span>
</template>

<script lang="ts" setup>
export interface Props {
  sortBy: { field: string; direction: string };
}

const props = withDefaults(defineProps<Props>(), {
  sortBy: () => ({ field: 'createdAt', direction: 'DESC' }),
});

const emit = defineEmits(['update']);

const options = computed(() => [
  { text: 'Creation date', field: 'createdAt', direction: 'DESC' },
  { text: 'Name', field: 'name', direction: 'ASC' },
]);

const update = (sortOption: { field: string; direction: string }) => {
  emit('update', sortOption);
};

const toggleOrder = () => {
  const direction = props.sortBy.direction === 'ASC' ? 'DESC' : 'ASC';
  emit('update', { ...props.sortBy, direction });
};
</script>
