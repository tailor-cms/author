<template>
  <VChipGroup
    :model-value="modelValue"
    column
    mandatory
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VChip
      v-for="it in categories"
      :key="it.value"
      :text="it.label"
      :value="it.value"
      color="secondary"
      size="small"
      rounded="pill"
      variant="tonal"
      filter
    />
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
