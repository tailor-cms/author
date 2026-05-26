<template>
  <VSelect
    v-model="mode"
    :items="MODE_OPTIONS"
    :menu-props="MENU_PROPS"
    :prepend-inner-icon="activeIcon"
    class="agent-mode-select"
    density="compact"
    item-title="title"
    item-value="value"
    rounded="lg"
    variant="solo-filled"
    flat
    hide-details
  >
    <template #item="{ item, props: itemProps }">
      <VListItem
        v-bind="itemProps"
        :prepend-icon="item.icon"
        :subtitle="item.subtitle"
      />
    </template>
  </VSelect>
</template>

<script lang="ts" setup>
import { AgentMode } from '@tailor-cms/interfaces/agent.ts';

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
    icon: 'mdi-pencil-outline',
    subtitle: 'Agent can read, write, generate, and delete',
  },
  {
    title: 'Inspect',
    value: AgentMode.Inspect,
    icon: 'mdi-eye-outline',
    subtitle: 'Read-only - agent can plan but not change anything',
  },
];

const MENU_PROPS = {
  contentClass: 'agent-panel-menu agent-mode-menu',
  zIndex: 9100,
};

const mode = defineModel<AgentMode>({ required: true });

const activeIcon = computed(
  () => MODE_OPTIONS.find((it) => it.value === mode.value)?.icon,
);
</script>

<style lang="scss" scoped>
.agent-mode-select {
  max-width: 9.375rem;

  :deep(.v-field__input) {
    font-size: 0.82rem;
    font-weight: 500;
  }
}
</style>
