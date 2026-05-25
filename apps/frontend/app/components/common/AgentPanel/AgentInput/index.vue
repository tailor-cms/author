<template>
  <div class="agent-input">
    <VTextarea
      ref="inputEl"
      v-model="text"
      :disabled="disabled"
      :placeholder="placeholder"
      bg-color="surface"
      class="input-field"
      data-agent-target="panel-input"
      density="comfortable"
      max-rows="8"
      rows="2"
      variant="solo-filled"
      auto-grow
      flat
      hide-details
      @focus="emit('focus')"
      @keydown="onKeydown"
    />
    <div class="input-row">
      <AgentCmdMenu
        ref="cmdMenuEl"
        v-model="text"
        :mode="mode"
        @autorun="(prompt: string) => emit('autorun', prompt)"
      />
      <VSpacer />
      <AgentModeSelect v-model="mode" />
      <AgentEffortSelect v-model="effort" />
      <VBtn
        :disabled="!canSubmit"
        :loading="disabled"
        class="input-send"
        color="primary"
        data-agent-target="panel-send"
        rounded="lg"
        variant="flat"
        @click="submit"
      >
        Send
        <template #append>
          <VIcon icon="mdi-arrow-up" size="18" />
        </template>
      </VBtn>
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
  autorun: [prompt: string];
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
  gap: 0.65rem;
  padding: 0.85rem 1rem 1rem;
  border-top: 1px solid rgb(var(--v-theme-outline-variant));
  background: rgb(var(--v-theme-surface));
}

.input-field {
  :deep(.v-field) {
    border: 1px solid rgb(var(--v-theme-outline-variant));
    border-radius: 0.875rem !important;
    background: rgba(var(--v-theme-on-surface), 0.04) !important;
    transition: box-shadow 120ms ease, border-color 120ms ease;
  }

  :deep(.v-field__overlay) {
    opacity: 0 !important;
  }

  :deep(.v-field--focused) {
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.18);
  }

  :deep(.v-field__input) {
    padding-top: 0.65rem;
    padding-bottom: 0.65rem;
    color: rgb(var(--v-theme-on-surface));
    font-size: 0.92rem;
    line-height: 1.5;
  }

  :deep(textarea::placeholder) {
    opacity: 0.42 !important;
    color: rgb(var(--v-theme-on-surface)) !important;
  }
}

.input-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-send {
  min-height: 2.25rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}
</style>
