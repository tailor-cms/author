<template>
  <VMenu v-model="isEditing" :close-on-content-click="false" width="440">
    <template #activator="{ props: menuProps }">
      <VBtn
        v-bind="menuProps"
        :color="dark ? 'primary-lighten-4' : 'primary-darken-2'"
        size="small"
        variant="tonal"
      >
        Edit
      </VBtn>
    </template>
    <VCard color="primary-lighten-5">
      <VCardText class="d-flex flex-column gr-1">
        <div
          v-for="{ key, label } in haesParams"
          :key="label"
          class="d-flex align-center"
        >
          <div class="label text-caption font-weight-bold">{{ label }}</div>
          <VSlider
            v-model="input[key]"
            color="primary"
            max="4"
            min="0"
            step="0.1"
            hide-details
          />
          <div class="text-subtitle-2 ml-2 slider-value">
            {{ input[key]?.toFixed(1) }}
          </div>
        </div>
      </VCardText>
      <VCardActions class="d-flex justify-end px-4 pt-0">
        <VBtn
          :slim="false"
          color="primary-darken-4"
          size="small"
          variant="text"
          @click="cancel"
        >
          Cancel
        </VBtn>
        <VBtn
          :slim="false"
          color="primary-darken-3"
          size="small"
          variant="tonal"
          @click="save"
        >
          Save
        </VBtn>
      </VCardActions>
    </VCard>
  </VMenu>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

import { haesParams } from './utils';

interface Props {
  dark?: boolean;
  value?: any;
}

const isEditing = ref(false);

const props = withDefaults(defineProps<Props>(), {
  value: () => haesParams.reduce((acc, { key }) => ({ ...acc, [key]: 0 }), {}),
  dark: false,
});
const emit = defineEmits(['save', 'cancel']);

const input = ref({ ...props.value });

const save = () => {
  isEditing.value = false;
  if (input.value === props.value) return;
  emit('save', { ...input.value });
};

const cancel = () => {
  isEditing.value = false;
  input.value = { ...props.value };
};

watch(
  () => props.value,
  (value) => {
    input.value = { ...value };
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
