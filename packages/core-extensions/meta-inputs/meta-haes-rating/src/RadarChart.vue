<template>
  <Radar :data="data" :options="chartOptions" />
</template>

<script lang="ts" setup>
import {
  ChartDataset,
  Chart as ChartJS,
  Filler,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import { computed } from 'vue';
import { Radar } from 'vue-chartjs';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

const props = defineProps<{
  dark: boolean;
  min: number;
  max: number;
  data: {
    labels: string[] | string[][];
    datasets: ChartDataset<'radar', (number | null)[]>[];
  };
}>();

const linesColor = computed(() =>
  props.dark ? 'rgba(236, 239, 241, 0.38)' : 'rgba(0, 0, 0, 0.25)',
);

const chartOptions = computed(() => ({
  responsive: true,
  scales: {
    r: {
      pointLabels: {
        color: props.dark ? '#eceff1' : '#000',
        font: { size: 12 },
      },
      grid: { color: linesColor.value, circular: true },
      angleLines: { color: linesColor.value },
      ticks: {
        count: 5,
        backdropColor: 'rgba(0, 0, 0, 0)',
        color: props.dark ? '#fff' : '#000',
        font: { size: 16 },
      },
      min: props.min,
      max: props.max,
    },
  },
}));
</script>
