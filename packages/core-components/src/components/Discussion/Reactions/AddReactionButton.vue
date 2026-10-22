<template>
  <EmojiPicker @select="emit('select', $event)">
    <template #activator="{ props: picker }">
      <VBtn
        v-tooltip:top="'Add reaction'"
        v-bind="picker"
        :density="density"
        :size="size"
        :rounded="rounded"
        aria-label="Add reaction"
        icon="mdi-emoticon-plus-outline"
        variant="text"
      />
    </template>
  </EmojiPicker>
</template>

<script lang="ts" setup>
import EmojiPicker from '../Emoji/EmojiPicker.vue';
import { VBtn } from 'vuetify/components';

// Opens the emoji picker to react to a message
withDefaults(
  defineProps<{
    size?: string;
    density?: 'default' | 'comfortable' | 'compact';
    rounded?: VBtn['rounded'];
  }>(),
  { size: 'small', density: 'default', rounded: 'lg' },
);

const emit = defineEmits<{ select: [emoji: string] }>();
</script>
