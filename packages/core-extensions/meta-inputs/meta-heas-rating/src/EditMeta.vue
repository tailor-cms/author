<template>
  <div class="mb-6">
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-body-small my-1">{{ meta.label }}</div>
      <VBtnToggle
        v-if="isNew"
        v-model="isEditing"
        :readonly="readonly"
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
        size="small"
        text="Edit"
        variant="tonal"
        @click="showRatingDialog(input)"
      />
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
        v-for="{ key, label } in heasParams"
        :key="key"
        class="d-flex align-center my-1"
      >
        <div class="label text-body-small">{{ label }}</div>
        <VSlider
          :model-value="input.rating?.[key]"
          color="primary"
          max="4"
          min="0"
          step="0.1"
          hide-details
          @update:model-value="updateRating({ [key]: $event })"
        />
        <div class="text-title-small ml-2 slider-value">
          {{ input.rating?.[key]?.toFixed(1) }}
        </div>
      </div>
    </div>
    <template v-else>
      <VAlert
        v-if="isReviewRequested && !isReviewer"
        class="px-6 py-12"
        icon="mdi-head-sync-outline"
        rounded="lg"
        variant="tonal"
        prominent
      >
        {{ alertMsg }}
      </VAlert>
      <VCard v-else class="pa-4" variant="tonal">
        <div v-if="isEmpty(input.rating)" class="text-center pa-4">
          <VAvatar size="64" variant="tonal">
            <VIcon icon="mdi-chart-timeline-variant-shimmer" size="x-large" />
          </VAvatar>
          <div class="text-body-large mt-4 px-8">{{ alertMsg }}</div>
        </div>
        <div v-else>
          <VSheet
            class="d-flex justify-center mt-n4"
            height="350"
            color="transparent"
          >
            <RadarChart :data="chartData" :max="4" :min="0" />
          </VSheet>
          <template v-if="meta.reviewable">
            <div class="font-weight-bold text-body-large mb-1">
              Review Notes
            </div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="review text-body-medium" v-html="input.review"></div>
          </template>
        </div>
        <VBtn
          v-if="meta.reviewable && !isReviewer && !isReviewRequested"
          :text="`${isEmpty(input?.rating) ? 'Request' : 'Re-Request'} Review`"
          class="mt-2"
          variant="tonal"
          prepend-icon="mdi-eye-plus"
          rounded="lg"
          block
          @click="update({ ...input, requestedReview: true })"
        />
        <VBtn
          v-else-if="isReviewRequested && isReviewer"
          class="mt-2"
          text="Add Review"
          variant="tonal"
          prepend-icon="mdi-comment-text-outline"
          rounded="lg"
          block
          @click="showRatingDialog()"
        />
      </VCard>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { cloneDeep, isEmpty } from 'lodash-es';
import { computed, ref } from 'vue';
import { useTheme } from 'vuetify';
import { RadarChart } from '@tailor-cms/core-components';

import { heasParams } from './utils';
import RateDialog from './RateDialog.vue';

interface Props {
  meta: any;
  dark?: boolean;
  isNew?: boolean;
  isReviewer?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  dark: false,
  isNew: false,
  isReviewer: false,
  readonly: false,
});
const emit = defineEmits(['update']);

const theme = useTheme();

const isEditing = ref(props.isNew);
const input = ref(cloneDeep(props.meta.value ?? { rating: {} }));
const dialogData = ref(cloneDeep(input.value));
const isDialogVisible = ref(false);

const colors = computed(() => theme.current.value.colors);
const isReviewRequested = computed(() => input.value?.requestedReview);
const isEditable = computed(() => {
  const { isReviewer, meta } = props;
  if (!meta.reviewable) return true;
  return !isReviewRequested.value && isReviewer && meta.value?.rating;
});

const chartData = computed(() => ({
  labels: heasParams.map((it) => it.label.split(' ')),
  datasets: [
    {
      data: heasParams.map(({ key }) => input.value?.rating[key]),
      backgroundColor: `${colors.value['on-surface']}40`,
      borderColor: `${colors.value.outline}BF`,
      borderWidth: 1,
    },
  ],
}));

const alertMsg = computed(() => {
  if (props.isNew) {
    return 'Rating Not Available. To edit the rating, switch to the sliders view.';
  }
  if (!props.meta.reviewable) {
    return 'Rating Not Available. To edit the rating, click on the button above';
  }
  if (isReviewRequested.value) {
    return props.isReviewer
      ? 'Rating Requested. To add the rating, click on the button below'
      : 'The rating has been requested! Waiting for expert feedback...';
  }
  return props.isReviewer
    ? 'Rating Not Available. The rating has not been requested yet'
    : 'Rating Not Available. To request the rating, click the button below';
});

const showRatingDialog = (input = {}) => {
  isDialogVisible.value = true;
  dialogData.value = cloneDeep(input);
};

const updateRating = (value: any) => {
  const newValue = cloneDeep(input.value);
  Object.assign(newValue.rating, value);
  update(newValue);
};

const update = (value: any) => {
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
}

.slider-value {
  width: 1.25rem;
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
