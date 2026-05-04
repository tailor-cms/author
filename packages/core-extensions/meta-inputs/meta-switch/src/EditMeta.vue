<template>
  <div class="my-2">
    <VSwitch
      v-model="input"
      :color="`primary-${dark ? 'lighten-4' : 'darken-1'}`"
      :label="meta.label"
      :name="meta.key"
      :readonly="readonly"
      base-color="primary-lighten-1"
      density="comfortable"
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
  dark?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  dark: false,
  readonly: false,
});
defineEmits(['update']);

const input = ref(props.meta.value);
</script>
