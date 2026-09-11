<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <p class="search-snippet text-body-medium" v-html="rendered" />
</template>

<script lang="ts" setup>
import { decode } from 'html-entities';
import { escape } from 'lodash-es';

const props = defineProps<{ snippet: string }>();

// The BE strips tags off the stored rich text but leaves its entities
// encoded, so they are decoded before escaping;
// The BE wraps matches in `⟪`/`⟫` markers; they are swapped for real
// markup only after escaping, so element content can't inject HTML.
const rendered = computed(() =>
  escape(decode(props.snippet))
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
