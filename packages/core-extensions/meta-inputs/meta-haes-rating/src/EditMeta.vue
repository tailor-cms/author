<template>
  <div class="mt-1 mb-6 mx-1">
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-caption">{{ meta.label }}</div>
      <VBtnToggle
        v-if="isNew"
        v-model="isEditing"
        :base-color="dark ? 'primary-lighten-4' : 'primary-darken-4'"
        density="compact"
        rounded="lg"
        variant="text"
        border
      >
        <VBtn :value="true" class="px-4" icon="mdi-tune" size="small" />
        <VBtn :value="false" class="px-4" icon="mdi-radar" size="small" />
      </VBtnToggle>
      <RatingSliders
        v-else
        :dark="dark"
        :value="input"
        @save="update"
      />
    </div>
    <div v-if="isEditing" class="py-3">
      <div
        v-for="{ key, label } in haesParams"
        :key="key"
        class="d-flex align-center my-2"
      >
        <div class="label text-caption">{{ label }}</div>
        <VSlider
          :model-value="input[key]"
          max="4"
          min="0"
          step="0.1"
          hide-details
          @update:model-value="update({ ...input, [key]: $event })"
        />
        <div class="text-subtitle-2 ml-2 slider-value">
          {{ input[key]?.toFixed(1) }}
        </div>
      </div>
    </div>
    <template v-else>
      <VCard
        v-if="isEmpty(input)"
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
            <template v-if="isNew">
              To edit the rating, switch to the sliders view.
            </template>
            <template v-else>
              To edit the rating, click on the edit button above.
            </template>
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
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

import isEmpty from 'lodash/isEmpty';
import { haesParams } from './utils';
import RadarChart from './RadarChart.vue';
import RatingSliders from './RatingSliders.vue';

interface Props {
  meta: any;
  dark?: boolean;
  isNew?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  dark: false,
  isNew: false,
});
const emit = defineEmits(['update']);

const isEditing = ref(props.isNew);
const input = ref({ ...props.meta.value ?? {} });

const chartData = computed(() => ({
  labels: haesParams.map((it) => it.label.split(' ')),
  datasets: [
    {
      data: haesParams.map(({ key }) => input.value[key]),
      backgroundColor: props.dark ? '#ECEFF140' : '#455A6433',
      borderColor: props.dark ? '#ECEFF1BF' : '#455A64BF',
      borderWidth: 2,
    },
  ],
}));

const update = (value) => {
  input.value = value;
  emit('update', props.meta.key, input.value);
};
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
