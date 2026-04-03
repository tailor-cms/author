<template>
  <VChipGroup
    :model-value="modelValue"
    base-color="primary-darken-1"
    class="mt-2"
    column
    mandatory
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VChip
      v-for="it in categories"
      :key="it.value"
      :value="it.value"
      color="primary-darken-2"
      size="small"
      variant="tonal"
      filter
    >
      {{ it.label }}
    </VChip>
  </VChipGroup>
</template>

<script lang="ts" setup>
defineProps<{
  modelValue: string;
  categories: { label: string; value: string }[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>
