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
  data: {
    labels: string[] | string[][];
    datasets: ChartDataset<'radar', (number | null)[]>[];
  };
}>();

const chartOptions = computed(() => ({
  responsive: true,
  scales: {
    r: {
      pointLabels: {
        color: props.dark ? 'rgb(236, 239, 241)' : 'black',
        font: { size: 12 },
      },
      grid: {
        color: props.dark ? 'rgba(236, 239, 241, 0.38)' : 'rgba(0, 0, 0, 0.25)',
        circular: true,
      },
      angleLines: {
        color: props.dark ? 'rgba(236, 239, 241, 0.38)' : 'rgba(0, 0, 0, 0.25)',
      },
      ticks: {
        count: 5,
        backdropColor: 'rgba(0, 0, 0, 0)',
        color: props.dark ? 'white' : 'black',
        font: { size: 16 },
        position: 'inside',
      },
      min: 0,
      max: 4,
    },
  },
}));
</script>
