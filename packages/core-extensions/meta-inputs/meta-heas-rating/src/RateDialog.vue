<template>
  <TailorDialog
    v-model="isDialogVisible"
    :title="`${value.rating ? 'Edit' : 'Add'} H@ES Rating`"
    header-icon="mdi-tune"
    persistent
  >
    <template #body>
      <VForm ref="form" validate-on="submit" novalidate @submit.prevent="save">
        <div class="mb-8">
          <div
            v-for="{ key, label } in heasParams"
            :key="label"
            class="d-flex align-center my-1"
          >
            <div class="label text-body-small">{{ label }}</div>
            <VSlider
              v-model="input.rating[key]"
              color="primary"
              max="4"
              min="0"
              step="0.1"
              hide-details
            />
            <div class="text-title-small ml-2 slider-value">
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
          <VBtn text="Cancel" variant="text" @click="cancel" />
          <VBtn
            :text="value.rating ? 'Save' : 'Submit'"
            class="ml-2"
            type="submit"
            variant="tonal"
          />
        </div>
      </VForm>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { cloneDeep } from 'lodash-es';

import { RichTextEditor, TailorDialog } from '@tailor-cms/core-components';
import { heasParams } from './utils';

const initializeRating = () => heasParams.reduce((acc, { key }) => {
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
    if (!value) emit('update:visible', false);
  },
});

const save = async () => {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (!valid) return;
  emit('save', { ...input.value, requestedReview: false });
  isDialogVisible.value = false;
};

const cancel = () => {
  isDialogVisible.value = false;
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
  width: 11.5rem;
  opacity: 0.7;
}

.slider-value {
  width: 1.5rem;
  opacity: 0.7;
  text-align: right;
}
</style>
