<template>
  <span class="composer-hint text-body-small text-medium-emphasis">
    <template v-if="isDragging">Drop a file</template>
    <template v-else-if="isUploading">Attaching...</template>
    <span v-else-if="overflow > 0" class="text-error">
      {{ pluralize('character', overflow, true) }} too long
    </span>
    <template v-else>
      <span
        v-for="{ key, label } in SHORTCUTS"
        :key="key"
        :class="`hint-shortcut hint-shortcut--${label}`"
      >
        <strong>{{ key }}</strong> {{ label }}
      </span>
      <strong>Enter</strong> to {{ submitLabel }}
    </template>
  </span>
</template>

<script lang="ts" setup>
import pluralize from 'pluralize-esm';

const SHORTCUTS = [
  { key: '@', label: 'mention' },
  { key: '#', label: 'reference' },
];

withDefaults(
  defineProps<{
    isDragging?: boolean;
    isUploading?: boolean;
    submitLabel?: string;
    overflow?: number;
  }>(),
  { isDragging: false, isUploading: false, submitLabel: 'send', overflow: 0 },
);
</script>

<style lang="scss" scoped>
.composer-hint {
  min-width: 0;
  padding-left: 0.375rem;
  white-space: nowrap;
}

strong {
  font-weight: 600;
}

.hint-shortcut {
  display: none;

  &::after {
    content: '·';
    margin: 0 0.375rem;
  }

  @container (min-width: 18.5rem) {
    &--mention {
      display: inline;
    }
  }

  @container (min-width: 24rem) {
    &--reference {
      display: inline;
    }
  }
}
</style>
