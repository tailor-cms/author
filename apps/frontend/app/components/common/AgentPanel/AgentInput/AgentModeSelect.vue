<template>
  <AgentOptionMenu
    v-model="mode"
    :compact="compact"
    :options="MODE_OPTIONS"
    content-class="agent-panel-menu agent-mode-menu"
    label="Agent mode"
  />
</template>

<script lang="ts" setup>
import { AgentMode } from '@tailor-cms/interfaces/agent.ts';

import AgentOptionMenu from './AgentOptionMenu.vue';

interface ModeOption {
  title: string;
  value: AgentMode;
  icon: string;
  subtitle: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    title: 'Edit',
    value: AgentMode.Edit,
    icon: 'mdi-square-edit-outline',
    subtitle: 'Agent can read, write, generate, and delete',
  },
  {
    title: 'Inspect',
    value: AgentMode.Inspect,
    icon: 'mdi-eye-outline',
    subtitle: 'Read-only - agent can plan but not change anything',
  },
];

defineProps<{ compact?: boolean }>();

const mode = defineModel<AgentMode>({ required: true });
</script>
