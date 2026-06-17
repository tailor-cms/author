<template>
  <TailorDialog
    :model-value="modelValue"
    color="error"
    contained
    header-icon="mdi-restart"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>Start a new session?</template>
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
