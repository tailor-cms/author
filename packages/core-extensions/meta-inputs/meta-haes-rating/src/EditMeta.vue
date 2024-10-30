<template>
  <VCard>
    <VCardText>
      <template v-for="(param, i) in params" :key="param">
        <VLabel>{{ param }}</VLabel>
        <VSlider v-model="input[i]" max="4" min="0" step="0.1" />
      </template>
      <RadarChart :data="chartData" />
    </VCardText>
  </VCard>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

import RadarChart from './RadarChart.vue';

interface Props {
  meta?: any;
}

const params = [
  'Learner Centered Content',
  'Active Learning',
  'Unbounded Inclusion',
  'Community Connections',
  'Real-World Outcomes',
];

const props = withDefaults(defineProps<Props>(), {
  meta: () => ({ value: null }),
});
// const emit = defineEmits(['update']);

const input = ref(props.meta.value || [2.5, 2.5, 2.5, 2.5, 2.5]);

const chartData = computed(() => {
  return {
    labels: params,
    datasets: [
      {
        data: [...input.value],
      },
    ],
  };
});

// const onChange = () => {
//   if (input.value === props.meta.value) return;
//   emit('update', props.meta.key, input.value);
// };
</script>
