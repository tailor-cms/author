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
            <VTimePicker v-model="timeInput" />
          </VWindowItem>
        </VWindow>
        <VCardActions class="d-flex pa-4">
          <VBtn v-if="step !== 1" prepend-icon="mdi-arrow-left" @click="step--">
            Back
          </VBtn>
          <VSpacer />
          <div>
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
          </div>
        </VCardActions>
      </VCard>
    </VMenu>
  </VTextField>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { Metadata } from '@tailor-cms/interfaces/schema';
import { useDate } from 'vuetify';
import { useDateFormat } from '@vueuse/core';
import { VTimePicker } from 'vuetify/labs/VTimePicker';

interface Meta extends Metadata {
  value?: string;
}
const props = defineProps<{ meta: Meta; dark: boolean }>();
const emit = defineEmits(['update']);

const { setHours, setMinutes } = useDate();

const placeholder = computed(() =>
  props.meta.hideTime ? 'mm/dd/yyyy' : 'mm/dd/yyyy hh:mm',
);

const step = ref(1);
const menu = ref(false);

const input = ref(props.meta.value);
const time = useDateFormat(() => input.value, 'HH:mm');

const dateInput = ref(input.value);
const timeInput = ref(input.value && time.value);

const displayDate = useDateFormat(
  () => input.value,
  props.meta.hideTime ? 'MM/DD/YYYY' : 'MM/DD/YYYY HH:mm',
);

const openMenu = () => (menu.value = true);
const closeMenu = () => (menu.value = false);

const getDatetime = () => {
  if (!dateInput.value) return;
  if (props.meta.hideTime) return dateInput.value;
  if (!timeInput.value) return;
  const [hours, minutes] = timeInput.value.split(':').map(it => parseInt(it));
  return setMinutes(setHours(dateInput.value, hours), minutes);
};

const save = () => {
  const datetime = getDatetime() as string;
  input.value = datetime;
  emit('update', props.meta.key, datetime);
  closeMenu();
};

watch(menu, (value) => {
  if (!value) return;
  step.value = 1;
  dateInput.value = input.value;
  timeInput.value = input.value && time.value;
});
</script>

<style lang="scss" scoped>
:deep(.v-window) {
  margin: 0;
}
</style>
