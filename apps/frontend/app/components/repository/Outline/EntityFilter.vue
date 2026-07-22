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

<script lang="ts" setup>
import type { EntityFilterOption } from '@/composables/useCollectionEntities';
import type { VChip } from 'vuetify/components';

interface Props {
  entities: EntityFilterOption[];
  rounded?: VChip['rounded'];
}

withDefaults(defineProps<Props>(), {
  rounded: 'pill',
});

const modelValue = defineModel<string>({ required: true });
</script>
