<template>
  <VTooltip
    content-class="emoji-card elevation-8"
    location="top"
    max-width="220"
  >
    <template #activator="{ props: activator }">
      <slot :props="activator" name="activator" />
    </template>
    <div class="emoji-card-glyph">
      <EmojiGlyph :value="value" />
    </div>
    <slot>{{ shortcode }}</slot>
  </VTooltip>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { emojiShortcode } from './emoji';
import EmojiGlyph from './EmojiGlyph.vue';

const props = defineProps<{ value: string }>();

// A custom emoji is stored as its `:name:` already
const shortcode = computed(() => emojiShortcode(props.value) ?? props.value);
</script>

<style lang="scss">
// Drawn outside the component
.v-tooltip > .v-overlay__content.emoji-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 1rem;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0.5rem;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.35;
  text-align: center;
  white-space: normal;
}

.emoji-card-glyph {
  margin-bottom: 0.5rem;
  font-size: 3rem;
  line-height: 1;
}
</style>
