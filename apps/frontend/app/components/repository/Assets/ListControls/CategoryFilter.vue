<template>
  <VChipGroup
    v-model="modelValue"
    class="category-filter"
    column
    mandatory
  >
    <VChip
      v-for="{ value, label } in categories"
      :key="value"
      :text="label"
      :value="value"
      color="secondary"
      role="button"
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
