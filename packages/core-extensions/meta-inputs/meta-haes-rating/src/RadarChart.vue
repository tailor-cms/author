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
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { computed } from 'vue';
import { Radar } from 'vue-chartjs';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartDataLabels,
);

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
  plugins: {
    datalabels: {
      color: '#fff',
      backgroundColor: function (context) {
        return context.dataset.borderColor;
      },
      font: { weight: 'bold', size: 10 },
      borderRadius: 25,
      formatter: (value: number) => value.toFixed(1),
    },
  },
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
        backdropColor: 'transparent',
        color: props.dark ? '#fff' : '#000',
        font: { size: 16 },
      },
      min: props.min,
      max: props.max,
    },
  },
}));
</script>
