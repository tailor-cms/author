<template>
  <div ref="msgListEl" class="message-list text-left py-5 px-4 ">
    <AgentEmptyState v-if="!messages.length" />
    <AgentChatMessage
      v-for="(message, i) in messages"
      :key="i"
      :content="message.content"
      :role="message.role"
      :tool-calls="message.toolCalls"
    />
    <div v-if="isRunning" class="list-status text-label-medium ga-2 mt-3 mx-1">
      <span class="thinking-dots" aria-hidden="true">
        <span class="dot" />
        <span class="dot" />
        <span class="dot" />
      </span>
      <span>{{ statusText }}</span>
    </div>
    <VAlert
      v-if="error"
      :text="error"
      class="mt-2 text-body-medium"
      density="comfortable"
      type="error"
      variant="tonal"
    />
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

  // Match the system scrollbar to the muted palette
  &::-webkit-scrollbar {
    width: 0.5rem;
    height: 0.5rem;
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
  animation: list-status-pulse 2.4s ease-in-out infinite;
}

.thinking-dots {
  display: inline-flex;
  align-items: center;
  gap: 0.1875rem;

  .dot {
    width: 0.25rem;
    height: 0.25rem;
    border-radius: 50%;
    background: rgb(var(--v-theme-on-surface));
    animation: thinking-bounce 1.4s ease-in-out infinite both;

    &:nth-child(2) {
      animation-delay: 0.16s;
    }
    &:nth-child(3) {
      animation-delay: 0.32s;
    }
  }
}

@keyframes list-status-pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

@keyframes thinking-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
