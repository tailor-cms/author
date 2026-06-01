<template>
  <div class="chat-message">
    <VSheet
      v-if="isUserMessage"
      color="surface-container"
      class="user-bubble ml-auto"
      max-width="85%"
      rounded="lg"
    >
      {{ content }}
    </VSheet>
    <div v-else class="message-column">
      <div v-if="content" class="message-content" v-html="renderedContent" />
      <div
        v-if="toolCalls?.length"
        class="message-tools d-flex flex-column mt-2 ga-2"
      >
        <VBtn
          v-if="hiddenToolCount > 0"
          :prepend-icon="areToolsExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          :text="toggleLabel"
          class="align-self-start"
          size="x-small"
          variant="text"
          @click="areToolsExpanded = !areToolsExpanded"
        />
        <AgentToolCard
          v-for="(toolCall, i) in visibleToolCalls"
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
import { useCurrentRepository } from '@/stores/current-repository';

const TOOL_CALL_PREVIEW = 4;

interface Props {
  role: 'user' | 'assistant';
  content?: string;
  toolCalls?: any[];
}

const props = defineProps<Props>();

const areToolsExpanded = ref(false);

const isUserMessage = computed(() => props.role === 'user');

const hiddenToolCount = computed(() =>
  Math.max(0, (props.toolCalls?.length ?? 0) - TOOL_CALL_PREVIEW),
);

const visibleToolCalls = computed(() => {
  const all = props.toolCalls ?? [];
  if (areToolsExpanded.value || all.length <= TOOL_CALL_PREVIEW) return all;
  return all.slice(-TOOL_CALL_PREVIEW);
});

const toggleLabel = computed(() => {
  if (areToolsExpanded.value) return 'Hide earlier calls';
  const noun = hiddenToolCount.value === 1 ? 'call' : 'calls';
  return `Show ${hiddenToolCount.value} earlier ${noun}`;
});

const repositoryStore = useCurrentRepository();

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
  font-size: 0.875rem;
  line-height: 1.625;
}

.chat-message + .chat-message {
  margin-top: 1.25rem;
}

.message-column {
  flex: 1;
  min-width: 0;
}

.message-content {
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

  :deep(pre) {
    padding: 0.5rem 0.6875rem;
    border-radius: 0.5rem;
    background: rgb(var(--v-theme-surface-container-low));
    font-size: 0.75rem;
    white-space: pre-wrap;
    word-break: break-word;
  }

  :deep(li) {
    margin: 0.125rem 0;
  }

  :deep(li > .agent-md-ul),
  :deep(li > .agent-md-ol) {
    margin: 0.125rem 0 0.125rem 1rem;
  }

  :deep(.agent-md-inline-code) {
    padding: 0.25rem 0.375rem;
    color: rgb(var(--v-theme-tertiary));
    font-family: Menlo, Consolas, monospace;
    font-size: 0.6875rem;
    background: rgb(var(--v-theme-surface-container));
    border-radius: 0.25rem;
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

.user-bubble {
  flex: 0 1 auto;
  padding: 0.625rem 0.875rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
