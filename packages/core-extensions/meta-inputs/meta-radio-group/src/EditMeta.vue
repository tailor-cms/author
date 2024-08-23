<template>
  <VRadioGroup
    :color="color"
    :label="meta.label"
    :model-value="meta.value"
    :name="meta.key"
    class="my-2"
    @update:model-value="$emit('update', meta.key, $event)"
  >
    <VRadio v-for="it in meta.items" :key="it.value" v-bind="it" />
  </VRadioGroup>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ meta?: any; color: string }>(), {
  meta: () => ({ value: null }),
  color: 'primary-darken-3',
});
defineEmits(['update']);
</script>

<style lang="scss" scoped>
:deep(.v-label) {
  white-space: normal;
  margin-inline-start: 0 !important;
}

:deep(.v-radio-group) {
  padding-inline-start: 0.375rem;
}
</style>
