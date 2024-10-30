<template>
  <Radar id="my-chart-id" :data="data" :options="chartOptions" />
</template>

<script lang="ts" setup>
import {
  Chart as ChartJS,
  Filler,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import { Radar } from 'vue-chartjs';
import { reactive } from 'vue';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

defineProps<{
  data: {
    labels: string[];
    datasets: { data: number[] }[];
  };
}>();

const chartOptions = reactive({
  responsive: true,
  scales: {
    r: {
      angleLines: {
        display: false,
      },
      ticks: {
        count: 5,
      },
      min: 0,
      max: 4,
    },
  },
});
</script>
