<template>
  <VRadioGroup
    v-model="input"
    :color="color"
    :label="meta.label"
    :name="meta.key"
    class="my-2"
    @change="$emit('update', meta.key, input)"
  >
    <VRadio v-for="it in meta.items" :key="it.value" v-bind="it" />
  </VRadioGroup>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const props = withDefaults(defineProps<{ meta?: any; color?: string }>(), {
  meta: () => ({ value: null }),
  color: 'primary-darken-3',
});
defineEmits(['update']);

const input = ref(props.meta.value);
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
