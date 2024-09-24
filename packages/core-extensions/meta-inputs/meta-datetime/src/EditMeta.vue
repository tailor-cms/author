<template>
  <VTextField
    :label="meta.label"
    :model-value="input && displayDate"
    :placeholder="placeholder"
    variant="outlined"
    persistent-placeholder
    readonly
    @click:control="openMenu"
    @keydown.enter="openMenu"
  >
    <VMenu
      v-model="menu"
      :close-on-content-click="false"
      :open-on-click="false"
      activator="parent"
      min-width="0"
    >
      <VCard>
        <VWindow v-model="step">
          <VWindowItem :value="1">
            <VDatePicker
              :model-value="dateInput && new Date(dateInput)"
              @update:model-value="dateInput = $event"
            />
          </VWindowItem>
          <VWindowItem :value="2">
            <VTimePicker v-model="timeInput" ampm-in-title />
          </VWindowItem>
        </VWindow>
        <VCardActions class="d-flex pa-4">
          <VBtn v-if="step === 2" prepend-icon="mdi-arrow-left" @click="step--">
            Back
          </VBtn>
          <VSpacer />
          <VBtn
            v-if="step === 1 && !meta.hideTime"
            :disabled="!dateInput"
            @click="step++"
          >
            Next
          </VBtn>
          <VBtn
            v-if="step === 2 || meta.hideTime"
            :disabled="!dateInput || (!meta.hideTime && !timeInput)"
            variant="tonal"
            @click="save"
          >
            Save
          </VBtn>
        </VCardActions>
      </VCard>
    </VMenu>
  </VTextField>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { Metadata } from '@tailor-cms/interfaces/schema';
import { useDate } from 'vuetify';
import { VTimePicker } from 'vuetify/labs/VTimePicker';

interface Meta extends Metadata {
  value?: string;
}
const props = defineProps<{ meta: Meta; dark: boolean }>();
const emit = defineEmits(['update']);

const date = useDate();

const placeholder = computed(() =>
  props.meta.hideTime ? 'mm/dd/yyyy' : 'mm/dd/yyyy hh:mm:ss',
);

const step = ref(1);
const menu = ref(false);

const input = ref<Date | string | undefined>(props.meta.value);
const time = computed(() => date.format(input.value, 'fullTime24h'));

const dateInput = ref(input.value);
const timeInput = ref(input.value && time.value);

const displayDate = computed(() =>
  date.format(
    input.value,
    props.meta.hideTime ? 'keyboardDate' : 'keyboardDateTime12h',
  ),
);

const openMenu = () => (menu.value = true);
const closeMenu = () => (menu.value = false);

const getDatetime = () => {
  if (!dateInput.value) return;
  if (props.meta.hideTime) return dateInput.value;
  if (!timeInput.value) return;
  const [hours, minutes] = timeInput.value.split(':').map((it) => parseInt(it));
  return date.setMinutes(date.setHours(dateInput.value, hours), minutes);
};

const save = () => {
  const datetime = getDatetime() as string;
  input.value = datetime;
  emit('update', props.meta.key, datetime);
  closeMenu();
};

watch(menu, (value) => {
  if (value) step.value = 1;
});
</script>

<style lang="scss" scoped>
:deep(.v-window) {
  margin: 0;
}

:deep(.v-time-picker-controls)
  .v-time-picker-controls__time
  .v-time-picker-controls__ampm {
  gap: 0.25rem;

  .v-time-picker-controls__ampm__pm,
  .v-time-picker-controls__ampm__am {
    border: none;
    border-radius: 1rem !important;
    height: 2.375rem;
    font-size: 1rem;
    font-weight: bold;
  }
}
</style>
