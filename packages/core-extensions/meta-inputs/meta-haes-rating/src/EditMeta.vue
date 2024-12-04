<template>
  <div class="mt-1 mb-6 mx-1">
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-caption my-1">{{ meta.label }}</div>
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
      <VBtn
        v-else-if="isEditable"
        :color="dark ? 'primary-lighten-4' : 'primary-darken-2'"
        size="small"
        variant="tonal"
        @click="showRatingDialog(input)"
      >
        Edit
      </VBtn>
      <RateDialog
        :dark="dark"
        :value="dialogData"
        :visible="isDialogVisible"
        :reviewable="meta.reviewable"
        @save="update({ ...input, ...$event })"
        @update:visible="isDialogVisible = $event"
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
          :model-value="input.rating?.[key]"
          max="4"
          min="0"
          step="0.1"
          hide-details
          @update:model-value="updateRating({ [key]: $event })"
        />
        <div class="text-subtitle-2 ml-2 slider-value">
          {{ input.rating?.[key]?.toFixed(1) }}
        </div>
      </div>
    </div>
    <template v-else>
      <VCard
        :color="dark ? 'primary-lighten-4' : 'primary-darken-2'"
        class="pa-4"
        variant="tonal"
      >
        <div v-if="isEmpty(input.rating)" class="text-center pa-4">
          <VAvatar size="64" variant="tonal">
            <VIcon icon="mdi-chart-timeline-variant-shimmer" size="x-large" />
          </VAvatar>
          <div class="text-body-1 mt-4 px-8">{{ alertMsg }}</div>
        </div>
        <div v-else>
          <VSheet
            class="d-flex justify-center mt-n4"
            height="350"
            color="transparent"
          >
            <RadarChart :dark="dark" :data="chartData" :max="4" :min="0" />
          </VSheet>
          <template v-if="meta.reviewable">
            <div class="font-weight-bold text-subtitle-1 mb-1">
              Review Notes
            </div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="review text-body-2" v-html="input.review"></div>
          </template>
        </div>
        <VBtn
          v-if="meta.reviewable && !isReviewer && !reviewRequested"
          class="mt-4"
          color="teal-accent-1"
          variant="tonal"
          prepend-icon="mdi-eye-plus"
          rounded="lg"
          block
          @click="update({ ...input, requestedReview: true })"
        >
          {{ isEmpty(input?.rating) ? 'Request' : 'Re-Request' }} Review
        </VBtn>
        <VBtn
          v-else-if="reviewRequested && isReviewer"
          class="mt-4"
          color="pink-lighten-4"
          variant="tonal"
          prepend-icon="mdi-comment-text-outline"
          rounded="lg"
          block
          @click="showRatingDialog()"
        >
          Add Review
        </VBtn>
      </VCard>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
import { haesParams } from './utils';
import RadarChart from './RadarChart.vue';
import RateDialog from './RateDialog.vue';

interface Props {
  meta: any;
  dark?: boolean;
  isNew?: boolean;
  isReviewer?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  dark: false,
  isNew: false,
  isReviewer: false,
});
const emit = defineEmits(['update']);

const isEditing = ref(props.isNew);
const input = ref(cloneDeep(props.meta.value ?? { rating: {} }));
const dialogData = ref(cloneDeep(input.value));
const isDialogVisible = ref(false);

const reviewRequested = computed(() => input.value?.requestedReview);
const isEditable = computed(() => {
  if (!props.meta.reviewable) return true;
  return !reviewRequested.value && props.isReviewer && props.meta.value?.rating;
});
const chartData = computed(() => ({
  labels: haesParams.map((it) => it.label.split(' ')),
  datasets: [
    {
      data: haesParams.map(({ key }) => input.value?.rating[key]),
      backgroundColor: props.dark ? '#ECEFF140' : '#455A6433',
      borderColor: props.dark ? '#ECEFF1BF' : '#455A64BF',
      borderWidth: 1,
    },
  ],
}));

const alertMsg = computed(() => {
  if (props.isNew) {
    return 'Rating Not Available. To edit the rating, switch to the sliders view.';
  }
  if (reviewRequested.value) {
    return props.isReviewer
      ? 'Rating Requested. To add the rating, click on the button below'
      : 'Rating Not Submitted. The rating has been requested';
  }
  return props.isReviewer
    ? 'Rating Not Available. The rating has not been requested yet'
    : 'Rating Not Available. To request the rating, click the button below';
});

const showRatingDialog = (input = {}) => {
  isDialogVisible.value = true;
  dialogData.value = cloneDeep(input);
};

const updateRating = (value) => {
  const newValue = cloneDeep(input.value);
  Object.assign(newValue.rating, value);
  update(newValue);
};

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

:deep(.review) {
  width: 100%;

  > * + * {
    margin-top: 0.75em;
  }

  ul,
  ol {
    padding: 0 1rem;
  }

  pre {
    background: #0d0d0d;
    white-space: break-spaces;
    color: #fff;
    font-family: 'JetBrainsMono', monospace;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.8rem;
    }
  }

  blockquote {
    padding-left: 1rem;
    border-left: 2px solid color-mix(in srgb, currentColor 20%, transparent);
  }
}
</style>
