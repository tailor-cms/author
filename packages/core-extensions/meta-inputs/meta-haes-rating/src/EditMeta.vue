<template>
  <div class="ma-1">
    <div class="d-flex align-center justify-space-between">
      <div class="text-caption mb-2">{{ meta.label }}</div>
      <VBtnToggle
        v-model="mode"
        :base-color="dark ? 'primary-lighten-4' : 'primary-darken-4'"
        density="compact"
        rounded="lg"
        variant="text"
        border
      >
        <VBtn
          :value="RatingMode.Slider"
          class="px-4"
          icon="mdi-tune"
          size="small"
        />
        <VBtn
          :value="RatingMode.Chart"
          class="px-4"
          icon="mdi-radar"
          size="small"
        />
      </VBtnToggle>
    </div>
    <div v-if="mode === RatingMode.Slider">
      <div
        v-for="(label, i) in labels"
        :key="label"
        class="d-flex align-center"
      >
        <div class="label text-caption">{{ label }}</div>
        <VSlider
          v-model="input[i]"
          :color="dark ? 'white' : 'primary'"
          max="4"
          min="0"
          step="0.1"
          hide-details
          thumb-label
          @end="onChange"
        />
        <div class="text-subtitle-2 ml-2 slider-value">{{ input[i] }}</div>
      </div>
    </div>
    <VSheet
      v-else
      class="d-flex justify-center"
      color="transparent"
      height="350"
    >
      <RadarChart :dark="dark" :data="chartData" />
    </VSheet>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

import RadarChart from './RadarChart.vue';

enum RatingMode {
  Slider = 'SLIDER',
  Chart = 'CHART',
}

interface Props {
  meta?: any;
  dark?: boolean;
}

const labels = [
  'Learner Centered Content',
  'Active Learning',
  'Unbounded Inclusion',
  'Community Connections',
  'Real-World Outcomes',
];

const mode = ref(RatingMode.Slider);

const props = withDefaults(defineProps<Props>(), {
  meta: () => ({ value: null }),
  dark: false,
});
const emit = defineEmits(['update']);

const input = ref([...(props.meta.value || new Array(5).fill(2.5))]);

const chartData = computed(() => ({
  labels: labels.map((it) => it.split(' ')),
  datasets: [
    {
      data: input.value,
      backgroundColor: 'rgba(233, 30, 99, 0.2)',
      borderColor: 'rgba(233, 30, 99, 0.7)',
      borderWidth: 2,
    },
  ],
}));

const onChange = () => {
  if (input.value === props.meta.value) return;
  emit('update', props.meta.key, input.value);
};
</script>

<style lang="scss" scoped>
.label {
  width: 10rem;
  opacity: 0.7;
}

.slider-value {
  width: 1.25rem;
  opacity: 0.7;
  text-align: right;
}
</style>
