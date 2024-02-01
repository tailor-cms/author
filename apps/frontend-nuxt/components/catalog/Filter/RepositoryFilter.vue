<template>
  <VMenu
    @update:model-value="search = ''"
    :close-on-content-click="false"
    offset="10"
  >
    <template v-slot:activator="{ props: menuProps }">
      <VTooltip open-delay="800" location="top">
        <template v-slot:activator="{ props: tooltipProps }">
          <VBtn
            v-bind="{ ...menuProps, ...tooltipProps }"
            :icon="icon"
            color="primary-lighten-2"
            variant="text"
          >
          </VBtn>
        </template>
        <span class="text-capitalize">{{ props.label }}</span>
      </VTooltip>
    </template>
    <VSheet class="pt-5 pa-3" elevation="0" min-width="300" rounded="0">
      <VTextField
        v-model="search"
        :label="`Filter ${props.label}...`"
        variant="outlined"
        hide-details
        clearable
      />
    </VSheet>
    <VList v-if="filteredOptions.length" elevation="0" rounded="0">
      <VListItem
        v-for="option in filteredOptions"
        :key="option.id"
        :ripple="false"
        @click.stop="emit('update', option)"
      >
        <template v-slot:prepend>
          <v-list-item-action start>
            <VCheckboxBtn
              :model-value="option.isSelected"
              readonly
            />
          </v-list-item-action>
        </template>
        <v-list-item-title v-text="option.name"></v-list-item-title>
      </VListItem>
    </VList>
    <div v-else class="bg-white pa-5 text-body-2">No {{ props.label }} found</div>
  </VMenu>
</template>

<script lang="ts" setup>
import { orderBy, filter as filterBy } from 'lodash';

export interface Props {
  label: string;
  icon: string;
  values: any;
}

const emit = defineEmits(['update']);
const props = withDefaults(defineProps<Props>(), {
  label: '',
  icon: 'mdi-tag',
  values: [],
});

const search = ref('');

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

<style lang="scss" scoped>
.v-list {
  max-height: 18.75rem;
  border-radius: 0;
  overflow-y: auto;
}
</style>
