<template>
  <VRadioGroup
    v-model="input"
    :color="color"
    :label="meta.label"
    :name="meta.key"
    :readonly="readonly"
    class="my-2"
    @change="$emit('update', meta.key, input)"
  >
    <VRadio v-for="it in meta.items" :key="it.value" v-bind="it" />
  </VRadioGroup>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

interface Props {
  meta?: any;
  color?: string;
  dark?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  meta: () => ({ value: null }),
  color: 'primary-darken-3',
  dark: false,
  readonly: false,
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
