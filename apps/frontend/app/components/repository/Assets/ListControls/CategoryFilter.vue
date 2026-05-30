<template>
  <VChipGroup
    v-model="modelValue"
    column
    mandatory
  >
    <VChip
      v-for="{ value, label } in categories"
      :key="value"
      :text="label"
      :value="value"
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
  categories: { label: string; value: string }[];
}>();

const modelValue = defineModel<string>({ required: true });
</script>
