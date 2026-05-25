<template>
  <div :class="`chat-message chat-message-${role}`">
    <UserAvatar
      v-if="role === 'user'"
      :img-url="userImgUrl"
      :size="28"
      class="message-avatar"
    />
    <div v-else class="message-avatar message-avatar-assistant">
      <img alt="Renoir" class="message-avatar-img" src="/img/renoir-head.png" />
    </div>
    <div class="message-column">
      <div v-if="content" class="message-bubble" v-html="renderedContent" />
      <div v-if="toolCalls?.length" class="message-tools">
        <AgentToolCard
          v-for="(toolCall, i) in toolCalls"
          :key="i"
          :tool-call="toolCall"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import AgentToolCard from './AgentToolCard/index.vue';
import { activityHref, elementHref } from './entityLinks';
import { renderMarkdown } from './markdown';
import { UserAvatar } from '@tailor-cms/core-components';
import { useAuthStore } from '@/stores/auth';
import { useCurrentRepository } from '@/stores/current-repository';

interface Props {
  role: 'user' | 'assistant';
  content?: string;
  toolCalls?: any[];
}

const props = defineProps<Props>();

const authStore = useAuthStore();
const repositoryStore = useCurrentRepository();

const userImgUrl = computed(() => (authStore.user as any)?.imgUrl || '');

const renderedContent = computed(() => {
  if (!props.content) return '';
  const repoId = repositoryStore.repositoryId;
  return renderMarkdown(props.content, {
    resolveEntityHref({ kind, id, uid }) {
      if (!repoId) return null;
      if (kind === 'activity') return activityHref(repoId, id);
      if (kind === 'element' && uid) return elementHref(repoId, id, uid);
      return null;
    },
  });
});
</script>

<style lang="scss" scoped>
.chat-message {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
}

.chat-message + .chat-message {
  margin-top: 1rem;
}

.message-avatar {
  display: flex;
  flex: 0 0 1.75rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 1.75rem;
  height: 1.75rem;
  margin-top: 0.125rem;
  border-radius: 50%;
}

.message-avatar-assistant {
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff5dd;
}

.message-avatar-img {
  width: 100%;
  height: 100%;
  padding: 0.125rem;
  object-fit: contain;
}

.message-column {
  flex: 1;
  min-width: 0;
}

.message-bubble {
  padding: 0.6875rem 0.9375rem;
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.875rem;
  line-height: 1.625;
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: 0.875rem;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02);

  :deep(.agent-md-p) {
    margin: 0 0 0.5rem;
  }

  :deep(.agent-md-p:last-child) {
    margin-bottom: 0;
  }

  :deep(.agent-md-h1),
  :deep(.agent-md-h2),
  :deep(.agent-md-h3) {
    margin: 0.375rem 0 0.3125rem;
    font-weight: 600;
  }

  :deep(.agent-md-h1) { font-size: 1.0625rem; }
  :deep(.agent-md-h2) { font-size: 1rem; }
  :deep(.agent-md-h3) { font-size: 0.9375rem; }

  :deep(.agent-md-ul),
  :deep(.agent-md-ol) {
    margin: 0 0 0.5rem 1.125rem;
    padding: 0;
  }

  :deep(li) {
    margin: 0.125rem 0;
  }

  :deep(li > .agent-md-ul),
  :deep(li > .agent-md-ol) {
    margin: 0.125rem 0 0.125rem 1rem;
  }

  :deep(.agent-md-inline-code) {
    padding: 0.125rem 0.375rem;
    color: rgb(var(--v-theme-secondary));
    font-family: Menlo, Consolas, monospace;
    font-size: 0.6875rem;
    background: rgb(var(--v-theme-surface-variant));
    border-radius: 0.25rem;
  }

  :deep(.agent-md-code) {
    margin: 0.375rem 0;
    padding: 0.5rem 0.6875rem;
    color: rgb(var(--v-theme-on-surface));
    font-size: 0.75rem;
    line-height: 1.4375;
    overflow-x: auto;
    border-radius: 0.5rem;
    background: rgb(var(--v-theme-surface-variant));
  }

  :deep(.agent-md-link) {
    color: rgb(var(--v-theme-primary));
    text-decoration: underline;
  }

  :deep(.agent-md-entity) {
    border-bottom: 1px dashed currentColor;
    color: rgb(var(--v-theme-primary));
    text-decoration: none;
  }

  :deep(.agent-md-entity:hover) {
    border-bottom-style: solid;
  }

  :deep(strong) {
    font-weight: 600;
  }
}

.chat-message-user .message-bubble {
  color: rgb(var(--v-theme-on-surface));
  border-color: rgba(var(--v-theme-primary), 0.55);
  background: rgba(var(--v-theme-primary), 0.28);
  box-shadow: 0 1px 0.125rem rgba(var(--v-theme-primary), 0.18);
}

.message-tools {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-top: 0.4375rem;
}
</style>
