<template>
  <div class="panel-header">
    <div class="header-row">
      <img alt="Renoir" class="header-brand" src="/img/renoir-head.png" />
      <span class="header-title">Renoir</span>
      <span class="header-shortcut px-1">
        Shortcut
        <kbd class="px-1">{{ shortcut }}</kbd>
      </span>
      <VSpacer />
      <VBtn
        :disabled="isRunning"
        density="comfortable"
        icon="mdi-restart"
        size="x-small"
        title="New session"
        variant="text"
        @click="$emit('session:reset')"
      />
      <VBtn
        density="comfortable"
        icon="mdi-close"
        size="x-small"
        title="Hide"
        variant="text"
        @click="$emit('panel:close')"
      />
    </div>
    <div class="header-focus">
      <VIcon icon="mdi-target" size="12" />
      <span class="header-focus-text">
        {{ focusLabel || 'No focus - select an activity in the editor' }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  focusLabel: string;
  isRunning?: boolean;
}

withDefaults(defineProps<Props>(), { isRunning: false });

defineEmits<{
  'session:reset': [];
  'panel:close': [];
}>();

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPad|iPhone/i.test(navigator.platform);

const shortcut = isMac ? '⌘K' : 'Ctrl+K';
</script>

<style lang="scss" scoped>
.panel-header {
  flex: 0 0 auto;
  color: white;
  background: rgb(var(--v-theme-primary-darken-3));
}

.header-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.625rem 0.25rem 0.75rem;
}

.header-brand {
  width: 1.75rem;
  height: 1.75rem;
  border: 0.125rem solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  background: #fff5dd;
  object-fit: cover;
}

.header-title {
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.header-shortcut {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  kbd {
    padding: 0.125rem 0.5rem;
    color: rgba(255, 255, 255, 0.85);
    font-family: Menlo, Consolas, monospace;
    font-size: 0.625rem;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 0.25rem;
    background: rgba(255, 255, 255, 0.08);
  }
}

.header-focus {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 1.25rem;
  padding: 0.25rem 0.875rem 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.6875rem;
}

.header-focus-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
