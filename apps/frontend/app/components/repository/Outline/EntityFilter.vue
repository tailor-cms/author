<template>
  <VChipGroup
    v-model="modelValue"
    class="entity-filter"
    mandatory
  >
    <VChip
      v-for="{ value, label, icon } in entities"
      :key="value"
      :prepend-icon="icon"
      :text="label"
      :value="value"
      color="tertiary"
      role="button"
      size="small"
      rounded="pill"
      variant="tonal"
      filter
    />
  </VChipGroup>
</template>

<script lang="ts" setup>
import type { EntityFilterOption } from '@/composables/useCollectionEntities';

defineProps<{
  entities: EntityFilterOption[];
}>();

const modelValue = defineModel<string>({ required: true });
</script>
