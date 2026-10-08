<template>
  <div v-if="groups.length" class="message-reactions d-flex flex-wrap ga-1">
    <VChip
      v-for="{ emoji, count, isCurrentUserReaction } in groups"
      :key="emoji"
      :aria-label="`${emoji} reaction, ${count}`"
      :aria-pressed="isCurrentUserReaction"
      :class="{ 'is-current-user-reaction': isCurrentUserReaction }"
      :color="isCurrentUserReaction ? 'primary' : undefined"
      class="reaction-pill"
      rounded="pill"
      size="small"
      tag="button"
      variant="tonal"
      border
      link
      @click="emit('toggle', emoji)"
    >
      <EmojiGlyph :value="emoji" />
      <span class="reaction-count ml-1">{{ count }}</span>
    </VChip>
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
// The reactions under a message, one pill per emoji with its count.
// Clicking a pill adds or takes back your own reaction.
import type { Reaction } from '@tailor-cms/interfaces/comment';
import { computed } from 'vue';

import EmojiGlyph from '../Emoji/EmojiGlyph.vue';
import EmojiPicker from '../Emoji/EmojiPicker.vue';

const props = withDefaults(
  defineProps<{ reactions?: Reaction[]; currentUserId?: number | null }>(),
  { reactions: () => [], currentUserId: null },
);

const emit = defineEmits<{ toggle: [emoji: string] }>();

const groups = computed(() => {
  const userIdsByEmoji = new Map<string, number[]>();
  props.reactions.forEach(({ emoji, userId }) => {
    const userIds = userIdsByEmoji.get(emoji) ?? [];
    userIdsByEmoji.set(emoji, [...userIds, userId]);
  });
  return [...userIdsByEmoji].map(([emoji, userIds]) => ({
    emoji,
    count: userIds.length,
    isCurrentUserReaction: userIds.some((id) => id === props.currentUserId),
  }));
});
</script>

<style lang="scss" scoped>
.reaction-count {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.reaction-pill.is-current-user-reaction {
  border-color: currentColor;

  .reaction-count {
    color: inherit;
    font-weight: 600;
  }
}
</style>
