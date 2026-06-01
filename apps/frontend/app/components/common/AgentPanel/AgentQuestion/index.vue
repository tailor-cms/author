<template>
  <VCard
    ref="rootEl"
    class="agent-question"
    color="surface-variant-low"
    rounded="lg"
    tabindex="0"
    border
    flat
    @keydown="onKeydown"
  >
    <div class="question-head text-medium-emphasis">
      <span class="question-title text-label-small text-uppercase">
        {{ title }}
      </span>
      <VSpacer />
      <VBtn
        density="comfortable"
        icon="mdi-close"
        size="x-small"
        variant="text"
        @click="$emit('cancel')"
      />
    </div>
    <div class="question-prompt text-title-small mb-4">{{ question }}</div>
    <VList class="question-list bg-transparent pa-0" nav>
      <QuestionOption
        v-for="(option, index) in options"
        :key="index"
        :hint="option.hint"
        :is-active="selectedIndex === index"
        :label="option.label"
        @hover="selectedIndex = index"
        @pick="commitOption(index)"
      />
      <QuestionOption
        v-if="allowOther"
        :is-active="isOtherSelected"
        label="Other"
        @hover="selectOther"
        @pick="activateOther"
      />
    </VList>
    <VTextField
      v-if="isOtherActive"
      ref="otherInputEl"
      v-model="otherText"
      class="question-other-field"
      density="compact"
      placeholder="Type your answer..."
      variant="outlined"
      autofocus
      hide-details
      @keydown.enter.prevent="submitOther"
      @keydown.esc.prevent="isOtherActive = false"
    />
    <VBtn
      :disabled="!canSubmit"
      class="mt-3"
      prepend-icon="mdi-keyboard-return"
      rounded="lg"
      text="Submit answer"
      variant="tonal"
      block
      @click="submit"
    />
    <div class="question-footer text-body-small mt-3">
      Esc to cancel, 1-{{ totalOptions }} to pick
    </div>
  </VCard>
</template>

<script lang="ts" setup>
import type { AgentQuestionOption } from '@tailor-cms/interfaces/agent.ts';
import QuestionOption from './QuestionOption.vue';

interface Props {
  title: string;
  question: string;
  options: AgentQuestionOption[];
  // Whether to show an "Other" option that opens a text field for freeform input.
  allowOther?: boolean;
}

const props = withDefaults(defineProps<Props>(), { allowOther: true });

const emit = defineEmits<{
  pick: [prompt: string];
  cancel: [];
}>();

// VCard ref; we focus its $el directly so the picker captures keyboard
// events without the parent having to wire @keydown explicitly.
const rootEl = ref<{ $el?: HTMLElement } | null>(null);
const otherInputEl = ref<{ focus: () => void } | null>(null);

const selectedIndex = ref(0);
const isOtherActive = ref(false);
const otherText = ref('');

const otherIndex = computed(() => props.options.length);

const isOtherSelected = computed(
  () => props.allowOther && selectedIndex.value === otherIndex.value,
);

const totalOptions = computed(() =>
  props.allowOther ? otherIndex.value + 1 : otherIndex.value,
);

const canSubmit = computed(() => {
  if (isOtherSelected.value) return otherText.value.trim().length > 0;
  return selectedIndex.value >= 0 && selectedIndex.value < otherIndex.value;
});

function commitOption(index: number) {
  const option = props.options[index];
  if (!option) return;
  selectedIndex.value = index;
  isOtherActive.value = false;
  emit('pick', option.prompt);
}

function selectOther() {
  selectedIndex.value = otherIndex.value;
}

function activateOther() {
  selectOther();
  isOtherActive.value = true;
  nextTick(() => otherInputEl.value?.focus());
}

function submitOther() {
  const value = otherText.value.trim();
  if (value) emit('pick', value);
}

function submit() {
  if (isOtherSelected.value) {
    submitOther();
    return;
  }
  const option = props.options[selectedIndex.value];
  if (option) emit('pick', option.prompt);
}

function onKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'Escape':
      e.preventDefault();
      emit('cancel');
      return;
    case 'Enter':
      e.preventDefault();
      submit();
      return;
    case 'ArrowDown':
      e.preventDefault();
      if (selectedIndex.value < totalOptions.value - 1) selectedIndex.value += 1;
      return;
    case 'ArrowUp':
      e.preventDefault();
      if (selectedIndex.value > 0) selectedIndex.value -= 1;
      return;
  }
  // 1-N digit pick - matches the visible footer hint.
  const num = Number.parseInt(e.key, 10);
  if (Number.isNaN(num) || num < 1 || num > totalOptions.value) return;
  e.preventDefault();
  const index = num - 1;
  if (props.allowOther && index === otherIndex.value) activateOther();
  else commitOption(index);
}

// Auto-focus the picker on mount and whenever the question changes so
// keyboard shortcuts work immediately without the user having to click.
watch(
  () => props.question,
  () => nextTick(() => rootEl.value?.$el?.focus()),
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.agent-question {
  outline: none;
  padding: 1rem 1rem 1.125rem;
  text-align: left;
}

.question-head {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.question-other-field {
  margin: 0.5rem 0 0;
}
</style>
