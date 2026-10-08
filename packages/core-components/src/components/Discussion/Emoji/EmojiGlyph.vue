<template>
  <img
    v-if="customEmoji"
    :alt="value"
    :src="customEmoji.url"
    :title="value"
    class="emoji-glyph emoji-glyph--custom"
    loading="lazy"
  >
  <span v-else-if="isShortcode">{{ value }}</span>
  <span v-else class="emoji-glyph emoji-glyph--char">{{ value }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { parseEmojiShortcode } from '@tailor-cms/utils';

import { useCustomEmoji } from './useCustomEmoji';

// Resolver for built-in and custom emojis
const props = defineProps<{ value: string }>();

const { resolve } = useCustomEmoji();

const customEmoji = computed(() => resolve(props.value));
const isShortcode = computed(() => !!parseEmojiShortcode(props.value));
</script>

<style lang="scss" scoped>
// Sized in `em`, so it scales with the text around it
.emoji-glyph {
  line-height: 1;

  &--char {
    font-size: 1.25em;
    vertical-align: -0.1em;
  }

  &--custom {
    display: inline-block;
    width: 1.375em;
    height: 1.375em;
    vertical-align: -0.3em;
    object-fit: contain;
  }
}
</style>
