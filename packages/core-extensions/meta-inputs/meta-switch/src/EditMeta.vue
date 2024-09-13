<template>
  <div class="px-1 pt-0 pb-10">
    <VSwitch
      v-model="input"
      :label="meta.label"
      :name="meta.key"
      color="primary darken-1"
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
