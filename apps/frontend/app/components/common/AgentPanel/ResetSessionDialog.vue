<template>
  <TailorDialog
    :model-value="modelValue"
    color="error"
    header-icon="mdi-restart"
    title="Start a new session?"
    contained
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #body>
      <div class="text-body-medium text-left">
        This clears the current conversation. This cannot be undone.
      </div>
    </template>
    <template #actions>
      <VBtn
        text="Cancel"
        variant="text"
        @click="$emit('update:modelValue', false)"
      />
      <VBtn
        class="px-3"
        color="error"
        text="Confirm"
        variant="flat"
        @click="confirm"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { TailorDialog } from '@tailor-cms/core-components';

defineProps<{ modelValue: boolean }>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'confirm': [];
}>();

function confirm() {
  emit('update:modelValue', false);
  emit('confirm');
}
</script>
