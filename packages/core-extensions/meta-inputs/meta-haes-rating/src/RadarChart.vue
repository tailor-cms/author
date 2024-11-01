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

const textColor = computed(() => (props.dark ? '#ECEFF1' : '#263238'));
const lineColor = computed(() => (props.dark ? '#ECEFF166' : '#26323840'));

const chartOptions = computed(() => ({
  responsive: true,
  plugins: {
    datalabels: {
      color: '#FFFFFF',
      backgroundColor: (context) => {
        const value = context.dataset.data[context.dataIndex];
        if (value >= 3) return '#009688';
        if (value >= 1.5) return '#9E9D24';
        return '#E91E63';
      },
      font: { weight: 'bold', size: 12 },
      borderRadius: 25,
      borderColor: props.dark ? '#ECEFF1BF' : '#263238BF',
      borderWidth: 2,
      padding: { top: 5, bottom: 5 },
      formatter: (value: number) => value.toFixed(1),
    },
  },
  scales: {
    r: {
      pointLabels: {
        color: textColor.value,
        font: { size: 12 },
      },
      grid: { color: lineColor.value, circular: true },
      angleLines: { color: lineColor.value },
      ticks: {
        count: 5,
        backdropColor: 'transparent',
        color: textColor.value,
        font: { size: 16 },
      },
      min: props.min,
      max: props.max,
    },
  },
}));
</script>
