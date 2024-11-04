<template>
  <div class="mt-1 mb-6 mx-1">
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-caption">{{ meta.label }}</div>
      <RatingSliders
        :dark="dark"
        :value="meta.value"
        @save="emit('update', meta.key, $event)"
      />
    </div>
    <VCard
      v-if="isEmpty"
      :color="dark ? 'primary-lighten-4' : 'primary-darken-2'"
      class="d-flex flex-wrap justify-center pa-8"
      variant="tonal"
    >
      <VAvatar size="64" variant="tonal">
        <VIcon icon="mdi-chart-timeline-variant-shimmer" size="x-large" />
      </VAvatar>
      <div class="my-4 w-100 text-center">
        <div class="text-body-1">Rating Not Available</div>
        <div class="text-body-2">
          To edit the rating, click on the edit button above.
        </div>
      </div>
    </VCard>
    <VSheet
      v-else
      class="d-flex justify-center"
      color="transparent"
      height="350"
    >
      <RadarChart :dark="dark" :data="chartData" :max="4" :min="0" />
    </VSheet>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { haesParams } from './utils';
import RadarChart from './RadarChart.vue';
import RatingSliders from './RatingSliders.vue';

interface Props {
  meta: any;
  dark?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  dark: false,
});
const emit = defineEmits(['update']);

const isEmpty = computed(() => !props.meta.value);
const chartData = computed(() => ({
  labels: haesParams.map((it) => it.label.split(' ')),
  datasets: [
    {
      data: haesParams.map(({ key }) => props.meta.value[key]),
      backgroundColor: props.dark ? '#ECEFF140' : '#455A6433',
      borderColor: props.dark ? '#ECEFF1BF' : '#455A64BF',
      borderWidth: 2,
    },
  ],
}));
</script>

<style lang="scss" scoped>
.v-sheet {
  letter-spacing: 0 !important;
}

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
