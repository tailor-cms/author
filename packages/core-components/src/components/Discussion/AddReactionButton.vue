<template>
  <EmojiPicker @select="emit('select', $event)">
    <template #activator="{ props: picker }">
      <VBtn
        v-tooltip:top="'Add reaction'"
        v-bind="picker"
        :density="density"
        :size="size"
        aria-label="Add reaction"
        icon="mdi-emoticon-plus-outline"
        variant="text"
      />
    </template>
  </EmojiPicker>
</template>

<script lang="ts" setup>
import EmojiPicker from './EmojiPicker/index.vue';

// Opens the emoji picker to react to a message
withDefaults(
  defineProps<{
    size?: string;
    density?: 'default' | 'comfortable' | 'compact';
  }>(),
  { size: 'small', density: 'default' },
);

const emit = defineEmits<{ select: [emoji: string] }>();
</script>
