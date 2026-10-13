<template>
  <VTextField
    v-bind="$attrs"
    v-model="model"
    :type="isVisible ? 'text' : 'password'"
    variant="outlined"
  >
    <template #append-inner>
      <VBtn
        :aria-label="isVisible ? 'Hide password' : 'Show password'"
        :icon="isVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
        color="on-surface-variant"
        density="comfortable"
        size="small"
        variant="text"
        @click="isVisible = !isVisible"
      />
    </template>
  </VTextField>
</template>

<script lang="ts" setup>
defineOptions({ inheritAttrs: false });

const model = defineModel<string>();

const isVisible = ref(false);
</script>
