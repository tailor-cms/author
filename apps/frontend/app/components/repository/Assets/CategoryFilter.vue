<template>
  <div class="d-flex align-center flex-wrap ga-2 mb-6">
    <VBtn
      v-for="it in categories"
      :key="it.value"
      :active="modelValue === it.value"
      :color="modelValue === it.value ? 'blue-lighten-4' : 'primary-lighten-3'"
      size="small"
      variant="tonal"
      @click="$emit('update:modelValue', it.value)"
    >
      {{ it.label }}
    </VBtn>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  modelValue: string;
  categories: { label: string; value: string }[];
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>
