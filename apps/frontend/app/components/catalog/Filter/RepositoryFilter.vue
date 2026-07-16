<template>
  <VMenu
    :close-on-content-click="false"
    offset="14"
    @update:model-value="search = ''"
  >
    <template #activator="{ props: menuProps }">
      <VBtn
        v-tooltip:top="{ text: `Filter by ${props.label}`, openDelay: 500 }"
        v-bind="menuProps"
        class="text-medium-emphasis"
        :icon="icon"
        :aria-label="props.label"
        variant="text"
        size="small"
      />
    </template>
    <VSheet class="bg-surface-container" min-width="300">
      <VListSubheader class="text-label-medium mx-4">
        Filter {{ props.label }}
      </VListSubheader>
      <VTextField
        v-model="search"
        :placeholder="`Search ${props.label}...`"
        bg-color="surface-container-high"
        class="ma-2 mt-0"
        density="compact"
        rounded="md"
        variant="solo"
        clearable
        hide-details
        flat
        autofocus
      />
      <VDivider />
      <VList
        v-if="filteredOptions.length"
        :items="filteredOptions"
        :selected="selected"
        item-title="name"
        max-height="300"
        select-strategy="leaf"
        return-object
        nav
        density="compact"
        @click:select="emit('update', $event.id)"
      >
        <template #prepend="{ isSelected, select }">
          <VCheckboxBtn :model-value="isSelected" color="primary" @click="select" />
        </template>
      </VList>
      <div v-else class="text-center pa-5 text-medium-emphasis text-label-large">
        No {{ props.label }} found
      </div>
    </VSheet>
  </VMenu>
</template>

<script lang="ts" setup>
import { filter as filterBy, orderBy } from 'lodash-es';

export interface Props {
  label?: string;
  icon?: string;
  values?: any;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  icon: 'mdi-tag',
  values: [],
});

const emit = defineEmits(['update']);

const search = ref('');

const selected = computed(() => {
  return props.values.filter(({ isSelected }: any) => isSelected);
});

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
