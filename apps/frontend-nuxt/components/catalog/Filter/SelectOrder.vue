<template>
  <span>
    <VMenu offset="10">
      <template v-slot:activator="{ props: menuProps }">
        <VTooltip open-delay="800" location="top">
          <template v-slot:activator="{ props: tooltipProps }">
            <VBtn
              v-bind="{ ...menuProps, ...tooltipProps }"
              class="my-1"
              color="primary-lighten-2"
              icon="mdi-sort-variant"
              variant="text"
            >
            </VBtn>
          </template>
          <span>Order by</span>
        </VTooltip>
      </template>
      <VList class="py-0">
        <VListItem
          v-for="{ text, field, direction } in options"
          :key="field"
          @click="update({ field, direction })"
          :class="{ 'bg-secondary-lighten-5': props.sortBy.field === field }"
        >
          <VListItemTitle class="pr-3 text-left">{{ text }}</VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
    <VTooltip open-delay="800" location="top">
      <template v-slot:activator="{ props }">
        <VBtn
          v-bind="props"
          @click="toggleOrder"
          color="primary-lighten-2"
          :icon="`mdi-sort-${
            sortBy?.direction === 'ASC' ? 'ascending' : 'descending'
          }`"
          variant="text"
          class="my-1"
        >
        </VBtn>
      </template>
      <span>Order direction</span>
    </VTooltip>
  </span>
</template>

<script lang="ts" setup>
export interface Props {
  sortBy: { field: string; direction: string };
}

const emit = defineEmits(['update']);
const props = withDefaults(defineProps<Props>(), {
  sortBy: { field: 'createdAt', direction: 'DESC' },
});

const options = computed(() => [
  { text: 'Creation date', field: 'createdAt', direction: 'DESC' },
  { text: 'Name', field: 'name', direction: 'ASC' },
]);

const update = (sortOption) => {
  emit('update', sortOption);
};

const toggleOrder = () => {
  const direction = props.sortBy.direction === 'ASC' ? 'DESC' : 'ASC';
  emit('update', { ...props.sortBy, direction });
};
</script>

<style lang="scss" scoped>
.v-menu,
.v-btn {
  display: inline-block;
}
</style>
