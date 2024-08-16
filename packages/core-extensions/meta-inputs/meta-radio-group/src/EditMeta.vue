<template>
  <VRadioGroup
    :label="meta.label"
    :model-value="meta.value"
    :name="meta.key"
    class="my-2"
    @change="$emit('update', meta.key, $event)"
  >
    <VRadio v-for="it in meta.items" :key="it.value" v-bind="it" />
  </VRadioGroup>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ meta?: any }>(), {
  meta: () => ({ value: null }),
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
