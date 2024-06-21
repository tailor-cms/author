<template>
  <VMenu
    :close-on-content-click="false"
    offset="14"
    @update:model-value="search = ''"
  >
    <template #activator="{ props: menuProps }">
      <VTooltip
        content-class="bg-primary-darken-4"
        location="top"
        open-delay="500"
      >
        <template #activator="{ props: tooltipProps }">
          <VBtn
            v-bind="{ ...menuProps, ...tooltipProps }"
            :icon="icon"
            color="primary-lighten-2"
            variant="text"
          />
        </template>
        <span class="text-capitalize">{{ props.label }}</span>
      </VTooltip>
    </template>
    <VSheet min-width="300">
      <VTextField
        v-model="search"
        :label="`Filter ${props.label}...`"
        class="mt-3 mx-3"
        variant="outlined"
        clearable
        hide-details
      />
      <VList
        v-if="filteredOptions.length"
        :items="filteredOptions"
        :selected="selected"
        base-color="primary-darken-3"
        item-title="name"
        item-value="id"
        max-height="300"
        select-strategy="leaf"
        return-object
        @click:select="emit('update', $event.id)"
      >
        <template #prepend="{ item }">
          <VCheckboxBtn :model-value="selected.includes(item.id)" />
        </template>
      </VList>
      <div v-else class="d-flex align-center py-5 px-6 text-primary-darken-3">
        <VIcon icon="mdi-information-outline" start />
        No {{ props.label }} found
      </div>
    </VSheet>
  </VMenu>
</template>

<script lang="ts" setup>
import filterBy from 'lodash/filter';
import orderBy from 'lodash/orderBy';

export interface Props {
  label: string;
  icon: string;
  values: any;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  icon: 'mdi-tag',
  values: [],
});

const emit = defineEmits(['update']);

const search = ref('');

const selected = computed(() =>
  props.values
    .filter(({ isSelected }: any) => isSelected)
    .map((it: any) => it.id),
);

const options = computed(() => {
  return orderBy(
    props.values,
    [(option) => option.name.toLowerCase()],
    ['asc'],
  );
});

const filteredOptions = computed(() => {
  if (!search.value) return options.value;
  const reqex = new RegExp(search.value.trim(), 'i');
  return filterBy(options.value, ({ name }) => reqex.test(name));
});
</script>

<!-- <style lang="scss" scoped>
.v-list {
  max-height: 18.75rem;
  border-radius: 0;
  overflow-y: auto;

  .v-list-item {
    cursor: pointer;
  }
}

:deep(.v-list-item-action) {
  min-width: 1.75rem;
}
</style> -->
