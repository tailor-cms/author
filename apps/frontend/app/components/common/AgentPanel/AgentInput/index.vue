<template>
  <div class="ma-4 mt-0">
    <VSheet class="agent-input" color="surface-container-low" border>
      <VTextarea
        ref="inputEl"
        v-model="text"
        :disabled="disabled"
        :placeholder="placeholder"
        class="input-field"
        density="comfortable"
        bg-color="transparent"
        max-rows="8"
        rows="2"
        auto-grow
        flat
        hide-details
        variant="solo"
        @focus="emit('focus')"
        @keydown="onKeydown"
      />
      <div class="d-flex align-center pa-2 pt-0 ga-2">
        <AgentCmdMenu
          ref="cmdMenuEl"
          v-model="text"
          :mode="mode"
          @autorun="(prompt, label) => emit('autorun', prompt, label)"
        />
        <AgentTargetChip :chip="focusChip" />
        <VSpacer />
        <AgentModeSelect v-model="mode" />
        <AgentEffortSelect v-model="effort" />
        <VBtn
          :disabled="!canSubmit"
          :loading="disabled"
          icon="mdi-arrow-up"
          aria-label="Send"
          class="input-send"
          color="primary"
          density="comfortable"
          rounded="lg"
          size="small"
          variant="flat"
          @click="submit"
        />
      </div>
    </VSheet>
  </div>
</template>

<script lang="ts" setup>
import type { AgentMode } from '@tailor-cms/interfaces/agent.ts';
import type { ReasoningEffortLiteral } from '@tailor-cms/interfaces/ai.ts';
import AgentEffortSelect from './AgentEffortSelect.vue';
import AgentModeSelect from './AgentModeSelect.vue';
import AgentCmdMenu from './AgentCmdMenu.vue';
import AgentTargetChip from './AgentTargetChip.vue';

interface FocusChip {
  short: string;
  full: string;
}

interface Props {
  disabled?: boolean;
  placeholder?: string;
  focusChip?: FocusChip | null;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  placeholder:
    'Ask Renoir - generate, refine, restructure. Press / for shortcuts.',
  focusChip: null,
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
  border-radius: 16px;
}
</style>
