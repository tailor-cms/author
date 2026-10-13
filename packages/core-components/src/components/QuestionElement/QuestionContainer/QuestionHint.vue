<template>
  <div class="hint-container mb-6">
    <VTextField
      :clearable="!isReadonly"
      :model-value="hint"
      :readonly="isReadonly"
      density="comfortable"
      label="Hint"
      variant="outlined"
      hide-details
      @update:model-value="$emit('update', $event)"
    />
  </div>
</template>

<script lang="ts" setup>
defineProps<{ hint: string; isReadonly: boolean }>();
defineEmits(['update']);
</script>
