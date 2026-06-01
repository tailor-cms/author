<template>
  <div class="agent-input">
    <VTextarea
      ref="inputEl"
      v-model="text"
      :disabled="disabled"
      :placeholder="placeholder"
      class="input-field"
      density="comfortable"
      bg-color="surface-container-low"
      max-rows="8"
      rows="2"
      rounded="lg"
      auto-grow
      flat
      hide-details
      @focus="emit('focus')"
      @keydown="onKeydown"
    />
    <div class="d-flex align-center ga-2">
      <AgentCmdMenu
        ref="cmdMenuEl"
        v-model="text"
        :mode="mode"
        @autorun="(prompt, label) => emit('autorun', prompt, label)"
      />
      <VSpacer />
      <AgentModeSelect v-model="mode" />
      <AgentEffortSelect v-model="effort" />
      <VBtn
        :disabled="!canSubmit"
        :loading="disabled"
        append-icon="mdi-arrow-up"
        class="input-send ml-1"
        color="secondary"
        text="Send"
        variant="tonal"
        @click="submit"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { AgentMode } from '@tailor-cms/interfaces/agent.ts';
import type { ReasoningEffortLiteral } from '@tailor-cms/interfaces/ai.ts';
import AgentEffortSelect from './AgentEffortSelect.vue';
import AgentModeSelect from './AgentModeSelect.vue';
import AgentCmdMenu from './AgentCmdMenu.vue';

interface Props {
  disabled?: boolean;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  placeholder:
    'Ask Renoir - generate, refine, restructure. Press / for shortcuts.',
});

const emit = defineEmits<{
  submit: [];
  autorun: [prompt: string, label: string];
  focus: [];
}>();

const inputEl = ref<{ focus: () => void } | null>(null);
const cmdMenuEl = ref<{
  handleKeydown: (e: KeyboardEvent) => boolean;
} | null>(null);

const text = defineModel<string>({ required: true });
const mode = defineModel<AgentMode>('mode', { required: true });
const effort = defineModel<ReasoningEffortLiteral>('effort', {
  required: true,
});

const canSubmit = computed(
  () => text.value.trim().length > 0 && !props.disabled,
);

function onKeydown(e: KeyboardEvent) {
  if (cmdMenuEl.value?.handleKeydown(e)) {
    e.preventDefault();
    return;
  }
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submit();
  }
}

function submit() {
  if (!canSubmit.value) return;
  emit('submit');
}

// Let the parent focus the field (e.g. on the Cmd+K shortcut).
defineExpose({ focus: () => inputEl.value?.focus() });
</script>

<style lang="scss" scoped>
.agent-input {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 0 1rem 1rem;
}
</style>
