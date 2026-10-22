<template>
  <div class="message-search d-flex align-center ga-2">
    <VIcon class="text-medium-emphasis" icon="mdi-magnify" size="18" />
    <ComposerInput
      v-model="query"
      :autofocus="autofocus"
      :placeholder="placeholder"
      aria-label="Search messages"
      class="search-input flex-grow-1"
      @escape="emit('escape')"
    />
  </div>
</template>

<script lang="ts" setup>
import ComposerInput from './ComposerInput.vue';

// Search box with the composer's autocomplete, so `@` and `#` filter by
// person and item
interface Props {
  placeholder?: string;
  autofocus?: boolean;
}

withDefaults(defineProps<Props>(), {
  placeholder: 'Search messages...',
  autofocus: false,
});

const emit = defineEmits<{ escape: [] }>();

const query = defineModel<string>({ default: '' });
</script>
