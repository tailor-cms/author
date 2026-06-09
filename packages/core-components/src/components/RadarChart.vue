<template>
  <Radar :data="props.data" :options="chartOptions" />
</template>

<script lang="ts" setup>
import type { ChartDataset } from 'chart.js';
import {
  Chart as ChartJS,
  Filler,
  LineElement,
  PointElement,
  RadialLinearScale,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { computed } from 'vue';
import { Radar } from 'vue-chartjs';
import { useTheme } from 'vuetify';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartDataLabels,
);

const props = defineProps<{
  min: number;
  max: number;
  data: {
    labels: string[] | string[][];
    datasets: ChartDataset<'radar', (number | null)[]>[];
  };
}>();

const theme = useTheme();
const colors = computed(() => theme.current.value.colors);

const textColor = computed(() => colors.value['on-surface']);
const lineColor = computed(() => `${colors.value['on-surface']}40`);
const borderColor = computed(() => `${colors.value['outline']}BF`);

const chartOptions = computed(() => ({
  responsive: true,
  plugins: {
    datalabels: {
      color: colors.value['on-secondary'],
      backgroundColor: (context: any) => {
        const value = context.dataset.data[context.dataIndex];
        if (value >= 3) return colors.value.success;
        if (value >= 1.5) return colors.value.warning;
        return colors.value.error;
      },
      font: { weight: 500, size: 12 },
      borderRadius: 25,
      borderColor: borderColor.value,
      borderWidth: 1,
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
