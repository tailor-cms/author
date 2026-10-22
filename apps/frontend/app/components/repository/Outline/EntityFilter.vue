<template>
  <VChipGroup
    v-model="modelValue"
    class="entity-filter"
    mandatory
  >
    <VChip
      v-for="{ value, label } in entities"
      :key="value"
      :rounded="rounded"
      :text="label"
      :value="value"
      color="secondary"
      role="button"
      size="small"
      variant="tonal"
      filter
    />
  </VChipGroup>
</template>

<script lang="ts" setup generic="T extends string">
import type { VChip } from 'vuetify/components';

interface Props {
  entities: { label: string; value: T }[];
  rounded?: VChip['rounded'];
}

withDefaults(defineProps<Props>(), {
  rounded: 'pill',
});

const modelValue = defineModel<T>({ required: true });
</script>
