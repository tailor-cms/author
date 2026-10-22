<template>
  <div class="message-search d-flex align-center ga-2">
    <VIcon class="text-medium-emphasis" icon="mdi-magnify" size="18" />
    <ComposerInput
      v-model="query"
      :placeholder="placeholder"
      aria-label="Search messages"
      class="search-input flex-grow-1"
    />
  </div>
</template>

<script lang="ts" setup>
import ComposerInput from './ComposerInput.vue';

// Search box with the composer's autocomplete, so `@` and `#` filter by
// person and item
withDefaults(defineProps<{ placeholder?: string }>(), {
  placeholder: 'Search messages...',
});

const query = defineModel<string>({ default: '' });
</script>

<style lang="scss" scoped>
.message-search {
  min-width: 0;
  padding-left: 0.75rem;
}

.search-input {
  min-width: 0;
  max-height: 5rem;
  padding: 0.5rem 0.75rem 0.5rem 0;
}
</style>
