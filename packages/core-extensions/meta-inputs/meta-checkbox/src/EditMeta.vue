<template>
  <div class="my-2">
    <div v-if="meta.label" class="text-medium-emphasis text-body-small">
      {{ meta.label }}
    </div>
    <VCheckbox
      v-model="input"
      :label="meta.description"
      :name="meta.key"
      :readonly="readonly"
      hide-details
      @change="$emit('update', props.meta.key, input)"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Metadata } from '@tailor-cms/interfaces/schema';
import { ref } from 'vue';

interface Meta extends Metadata {
  value?: string;
}
interface Props {
  meta: Meta;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), { readonly: false });
defineEmits(['update']);

const input = ref(props.meta.value);
</script>

