<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="d-flex align-baseline">
        <div class="text-body-2 font-weight-bold">{{ label }}</div>
        <div class="ml-2 text-caption text-medium-emphasis">
          {{ modelValue.length }} of {{ options.length }} selected
        </div>
      </div>
      <VBtn
        color="primary-darken-2"
        size="x-small"
        variant="text"
        @click="toggleAll"
      >
        {{ allSelected ? 'Clear' : 'Select all' }}
      </VBtn>
    </div>
    <VRow dense>
      <VCol
        v-for="(option, index) in options"
        :key="option"
        cols="12"
        sm="6"
      >
        <VCard
          :color="isSelected(index) ? 'primary-darken-2' : undefined"
          :variant="isSelected(index) ? 'tonal' : 'flat'"
          class="d-flex align-center pa-3"
          height="100%"
          rounded="lg"
          border
          @click="toggle(index)"
        >
          <span class="text-body-2 flex-grow-1">{{ option }}</span>
          <VIcon v-if="isSelected(index)" class="ml-2" size="20">
            mdi-check-circle
          </VIcon>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  modelValue: number[];
  options: string[];
  label: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number[]];
}>();

const allSelected = computed(
  () =>
    props.options.length > 0 &&
    props.modelValue.length === props.options.length,
);

const isSelected = (index: number) => props.modelValue.includes(index);

const toggle = (index: number) => {
  const next = isSelected(index)
    ? props.modelValue.filter((i) => i !== index)
    : [...props.modelValue, index];
  emit('update:modelValue', next);
};

const toggleAll = () => {
  emit(
    'update:modelValue',
    allSelected.value ? [] : props.options.map((_, i) => i),
  );
};
</script>
