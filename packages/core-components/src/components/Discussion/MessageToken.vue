<template>
  <component
    :is="href ? 'a' : 'span'"
    :class="[`message-token--${kind}`, { 'is-self': isSelf, 'is-link': href }]"
    :href="href"
    class="message-token"
  >
    <VIcon v-if="icon" :icon="icon" class="token-icon" size="13" />
    <span class="token-label">{{ text }}</span>
  </component>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

// A mention or a reference inside a message.
interface Props {
  kind: 'mention' | 'reference';
  label: string;
  icon?: string;
  href?: string;
  // A mention of the reader, in its own colour
  isSelf?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  icon: undefined,
  href: undefined,
  isSelf: false,
});

// A mention keeps its @
const text = computed(() =>
  props.kind === 'mention' ? `@${props.label}` : props.label,
);
</script>

<style lang="scss" scoped>
.message-token {
  display: inline-flex;
  gap: 0.1875rem;
  align-items: center;
  max-width: 100%;
  padding: 0 0.25rem;
  border-radius: 0.25rem;
  background: rgba(var(--v-theme-on-surface), 0.06);
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  text-decoration: none;
  vertical-align: baseline;
  transition: background-color 0.15s ease;
}

.token-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.token-icon {
  flex-shrink: 0;
  opacity: 0.75;
}

.message-token--mention {
  color: rgb(var(--v-theme-secondary));

  &.is-self {
    background: rgba(var(--v-theme-primary), 0.18);
    color: rgb(var(--v-theme-primary));
  }
}

.message-token--reference {
  color: rgb(var(--v-theme-info));
}

.is-link {
  cursor: pointer;

  &:hover {
    background: rgba(var(--v-theme-on-surface), 0.12);
  }

  &.is-self:hover {
    background: rgba(var(--v-theme-primary), 0.28);
  }
}
</style>
