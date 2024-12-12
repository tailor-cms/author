<template>
  <div class="hint-container">
    <div class="text-subtitle-2 mb-2">Hint</div>
    <VTextField
      :model-value="hint"
      placeholder="Optional hint..."
      variant="outlined"
      :readonly="!isEditing"
      :clearable="isEditing"
      @update:model-value="$emit('update', $event)"
    />
  </div>
</template>

<script lang="ts" setup>
defineProps<{ hint: string; isEditing: boolean }>();
defineEmits(['update']);
</script>
