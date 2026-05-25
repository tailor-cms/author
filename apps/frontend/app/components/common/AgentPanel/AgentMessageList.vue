<template>
  <div ref="msgListEl" class="message-list">
    <AgentEmptyState v-if="!messages.length" />
    <AgentChatMessage
      v-for="(message, i) in messages"
      :key="i"
      :content="message.content"
      :role="message.role"
      :tool-calls="message.toolCalls"
    />
    <div v-if="isRunning" class="list-status">
      <VProgressCircular color="primary" :size="14" :width="2" indeterminate />
      <span>{{ statusText }}</span>
    </div>
    <div v-if="error" class="list-error">
      <VIcon class="ma-1" color="error" icon="mdi-alert-circle" size="14" />
      {{ error }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import AgentChatMessage from './AgentChatMessage.vue';
import AgentEmptyState from './AgentEmptyState.vue';
import type { ChatMessage } from './composables/useAgentSession';

interface Props {
  isRunning: boolean;
  messages: ChatMessage[];
  statusText: string;
  error: string | null;
}

defineProps<Props>();

const msgListEl = ref<HTMLElement | null>(null);

function scrollToBottom() {
  if (!msgListEl.value) return;
  msgListEl.value.scrollTop = msgListEl.value.scrollHeight;
}

defineExpose({ scrollToBottom });
</script>

<style lang="scss" scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 1.125rem 1rem;
  background: rgba(var(--v-theme-on-surface), 0.04);
  text-align: left;

  // Match the system scrollbar to the muted palette
  &::-webkit-scrollbar {
    width: 0.5rem;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 0.25rem;
    background: rgb(var(--v-theme-outline-variant));
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgb(var(--v-theme-outline));
  }
}

.list-status {
  display: flex;
  align-items: center;
  gap: 0.4375rem;
  margin: 0.875rem 0.1875rem 0;
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.8125rem;
  font-style: italic;
  animation: list-status-pulse 2.4s ease-in-out infinite;
}

.list-error {
  display: flex;
  align-items: center;
  margin-top: 0.625rem;
  padding: 0.5625rem 0.6875rem;
  color: rgb(var(--v-theme-on-error-container, white));
  font-size: 0.8125rem;
  border-radius: 0.5rem;
  background: rgb(var(--v-theme-error-container, var(--v-theme-error)));
}

@keyframes list-status-pulse {
  0%,
  100% {
    opacity: 0.85;
  }
  50% {
    opacity: 1;
  }
}
</style>
