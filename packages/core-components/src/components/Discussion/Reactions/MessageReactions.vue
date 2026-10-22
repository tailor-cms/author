<template>
  <div v-if="groups.length" class="message-reactions d-flex flex-wrap ga-1">
    <ReactionPill
      v-for="[emoji, group] in groups"
      :key="emoji"
      :current-user-id="currentUserId"
      :emoji="emoji"
      :reactions="group"
      @toggle="emit('toggle', emoji)"
    />
    <EmojiPicker @select="emit('toggle', $event)">
      <template #activator="{ props: picker }">
        <VChip
          v-tooltip:top="'Add reaction'"
          v-bind="picker"
          aria-label="Add another reaction"
          class="reaction-add text-medium-emphasis"
          rounded="pill"
          size="small"
          tag="button"
          variant="text"
          border
          link
        >
          <VIcon icon="mdi-emoticon-plus-outline" size="15" />
        </VChip>
      </template>
    </EmojiPicker>
  </div>
</template>

<script lang="ts" setup>
import type { Reaction } from '@tailor-cms/interfaces/comment';
import { computed } from 'vue';

import EmojiPicker from '../Emoji/EmojiPicker.vue';
import ReactionPill from './ReactionPill.vue';

const props = withDefaults(
  defineProps<{ reactions?: Reaction[]; currentUserId?: number | null }>(),
  { reactions: () => [], currentUserId: null },
);

const emit = defineEmits<{ toggle: [emoji: string] }>();

// Reactions by emoji, in the order each emoji first appeared
const groups = computed(() => {
  const byEmoji = new Map<string, Reaction[]>();
  props.reactions.forEach((reaction) => {
    const list = byEmoji.get(reaction.emoji) ?? [];
    byEmoji.set(reaction.emoji, [...list, reaction]);
  });
  return [...byEmoji];
});
</script>
