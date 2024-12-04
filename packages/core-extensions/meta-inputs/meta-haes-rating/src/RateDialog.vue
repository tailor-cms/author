<template>
  <TailorDialog v-model="isDialogVisible" header-icon="mdi-account" persistent>
    <template #header>{{ value.rating ? 'Edit' : 'Add' }} H@ES Rating</template>
    <template #body>
      <VForm ref="form" validate-on="submit" novalidate @submit.prevent="save">
        <div class="mb-8">
          <div
            v-for="{ key, label } in haesParams"
            :key="label"
            class="d-flex align-center"
          >
            <div class="label text-caption font-weight-bold">{{ label }}</div>
            <VSlider
              v-model="input.rating[key]"
              color="primary"
              max="4"
              min="0"
              step="0.1"
              hide-details
            />
            <div class="text-subtitle-2 ml-2 slider-value">
              {{ input.rating[key]?.toFixed(1) }}
            </div>
          </div>
        </div>
        <RichTextEditor
          v-if="reviewable"
          v-model="input.review"
          :rules="[(val) => !!val || 'Review is required.']"
          variant="outlined"
          label="Review"
        />
        <div class="d-flex justify-end pb-3">
          <VBtn
            color="primary-darken-4"
            variant="text"
            @click="cancel"
          >
            Cancel
          </VBtn>
          <VBtn
            class="ml-2"
            color="primary-darken-3"
            variant="tonal"
            type="submit"
          >
            {{ value.rating ? 'Save' : 'Submit' }}
          </VBtn>
        </div>
      </VForm>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import cloneDeep from 'lodash/cloneDeep';

import { RichTextEditor, TailorDialog } from '@tailor-cms/core-components';
import { haesParams } from './utils';

const initializeRating = () => haesParams.reduce((acc, { key }) => {
  acc[key] = 0;
  return acc;
}, {});

interface Props {
  visible: boolean;
  reviewable?: boolean;
  dark?: boolean;
  value?: any;
}

const props = withDefaults(defineProps<Props>(), {
  value: () => ({}),
  reviewable: false,
  dark: false,
});
const emit = defineEmits(['save', 'cancel', 'update:visible']);

const form = ref();
const input = ref();

const isDialogVisible = computed({
  get: () => props.visible,
  set(value) {
    if (!value) close();
  },
});

const save = async () => {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (valid) {
    emit('save', { ...input.value, requestedReview: false });
    isDialogVisible.value = false;
  }
};

const cancel = () => {
  isDialogVisible.value = false;
};

const close = () => {
  emit('update:visible', false);
};

watch(
  () => props.value,
  (value) => {
    input.value = Object.assign(
      { rating: initializeRating() },
      cloneDeep(value),
    );
  },
  { deep: true },
);
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
