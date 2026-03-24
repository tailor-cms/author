<template>
  <VDialog
    :model-value="modelValue"
    max-width="420"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="text-h6 pt-5 px-6">
        Cancel repository creation?
      </VCardTitle>
      <VCardText class="px-6">
        Documents are still being processed and will be lost if you cancel now.
      </VCardText>
      <VCardActions class="px-6 pb-4">
        <VSpacer />
        <VBtn variant="text" @click="emit('update:modelValue', false)">
          Continue waiting
        </VBtn>
        <VBtn
          color="error"
          variant="tonal"
          @click="emit('confirm')"
        >
          Cancel anyway
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script lang="ts" setup>
defineProps<{ modelValue: boolean }>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'confirm': [];
}>();
</script>
