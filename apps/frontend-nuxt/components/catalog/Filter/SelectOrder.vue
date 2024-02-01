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
          v-for="{ text, field, order } in options"
          :key="field"
          @click="update({ field, order })"
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
            sortBy?.order === 'ASC' ? 'ascending' : 'descending'
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
  sortBy: { field: string; order: string };
}

const emit = defineEmits(['update']);
const props = withDefaults(defineProps<Props>(), {
  sortBy: { field: 'createdAt', order: 'DESC' },
});

const options = computed(() => [
  { text: 'Creation date', field: 'createdAt', order: 'DESC' },
  { text: 'Name', field: 'name', order: 'ASC' },
]);

const update = (sortOption) => {
  emit('update', sortOption);
};

const toggleOrder = () => {
  const order = props.sortBy.order === 'ASC' ? 'DESC' : 'ASC';
  emit('update', { ...props.sortBy, order });
};
</script>

<style lang="scss" scoped>
.v-menu,
.v-btn {
  display: inline-block;
}
</style>
