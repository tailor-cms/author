<template>
  <div class="text-left my-2">
    <div class="ma-1 text-body-2">{{ meta.label }}</div>
    <div class="d-flex">
      <ColorInput :color="selected" @input="select" />
      <div
        v-for="(group, index) in colors"
        :key="index"
        class="d-flex flex-column flex-wrap"
      >
        <VBtn
          v-for="color in group"
          :key="color"
          :aria-label="color"
          :color="color"
          class="color-btn"
          size="24"
          flat
          @click="select(color)"
        >
          <VIcon
            v-if="color === selected"
            icon="mdi-check-circle"
            size="small"
          />
        </VBtn>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Metadata } from '@tailor-cms/interfaces/schema';
import { ref } from 'vue';

import ColorInput from './ColorInput.vue';

const DEFAULT_COLORS = [
  ['#4D4D4D', '#333333', '#000000'],
  ['#999999', '#808080', '#666666'],
  ['#FFFFFF', '#CCCCCC', '#B3B3B3'],
  ['#F44E3B', '#D33115', '#9F0500'],
  ['#FE9200', '#E27300', '#C45100'],
  ['#FCDC00', '#FCC400', '#FB9E00'],
  ['#DBDF00', '#B0BC00', '#808900'],
  ['#A4DD00', '#68BC00', '#194D33'],
  ['#68CCCA', '#16A5A5', '#0C797D'],
  ['#73D8FF', '#009CE0', '#0062B1'],
  ['#AEA1FF', '#7B64FF', '#653294'],
  ['#FDA1FF', '#FA28FF', '#AB149E'],
];

interface Meta extends Metadata {
  value?: string;
}

const props = defineProps<{ meta: Meta }>();
const emit = defineEmits(['update']);

const colors = ref(props.meta.colors ?? DEFAULT_COLORS);
const selected = ref(props.meta.value ?? '#000000');

const select = (color: string) => {
  if (selected.value === color) return;
  selected.value = color;
  emit('update', props.meta.key, color);
};
</script>

<style lang="scss" scoped>
.color-btn {
  margin: 0.0625rem;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 10%);
}
</style>
