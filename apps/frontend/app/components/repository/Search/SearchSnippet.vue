<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <p class="search-snippet text-body-medium mb-0" v-html="rendered" />
</template>

<script lang="ts" setup>
import { escape } from 'lodash-es';

const props = defineProps<{ snippet: string }>();

// The BE wraps matches in `⟪`/`⟫` markers; they are swapped for real
// markup only after escaping, so element content can't inject HTML.
const rendered = computed(() =>
  escape(props.snippet)
    .replaceAll('⟪', '<mark>')
    .replaceAll('⟫', '</mark>'),
);
</script>

<style lang="scss" scoped>
.search-snippet {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));

  :deep(mark) {
    padding: 0 0.2em;
    border-radius: 0.25em;
    background: rgb(var(--v-theme-primary-container));
    color: rgb(var(--v-theme-on-primary-container));
  }
}
</style>
