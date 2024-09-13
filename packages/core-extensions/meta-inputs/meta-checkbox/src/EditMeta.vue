<template>
  <div class="my-2">
    <div v-if="meta.label" class="label ma-1 text-caption">
      {{ meta.label }}
    </div>
    <VCheckbox
      v-model="input"
      :color="`primary-${dark ? 'lighten-4' : 'darken-1'}`"
      :label="meta.description"
      :name="meta.key"
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

const props = defineProps<{ meta: Meta; dark: boolean }>();
defineEmits(['update']);

const input = ref(props.meta.value);
</script>

<style lang="scss" scoped>
.label {
  opacity: 0.65;
}
</style>
