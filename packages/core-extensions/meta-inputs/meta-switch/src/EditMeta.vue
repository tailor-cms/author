<template>
  <div class="my-2">
    <VSwitch
      v-model="input"
      :color="`primary-${dark ? 'lighten-4' : 'darken-1'}`"
      :label="meta.label"
      :name="meta.key"
      base-color="primary-lighten-1"
      density="comfortable"
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
const props = defineProps<{ meta: Meta; dark: boolean }>();
defineEmits(['update']);

const input = ref(props.meta.value);
</script>
