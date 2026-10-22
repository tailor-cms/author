<template>
  <EmojiCard :value="emoji">
    <template #activator="{ props: tooltip }">
      <VChip
        v-bind="tooltip"
        :aria-label="description"
        :aria-pressed="isCurrentUserReaction"
        :class="{ 'is-current-user-reaction': isCurrentUserReaction }"
        :color="isCurrentUserReaction ? 'secondary' : undefined"
        class="reaction-pill"
        rounded="pill"
        size="small"
        tag="button"
        variant="tonal"
        border
        link
        @click="emit('toggle')"
      >
        <EmojiGlyph :value="emoji" />
        <span class="reaction-count ml-1">{{ reactions.length }}</span>
      </VChip>
    </template>
    <div>
      {{ who }}
      <span class="reaction-tooltip-verb">reacted with {{ label }}</span>
    </div>
  </EmojiCard>
</template>

<script lang="ts" setup>
import type { Reaction } from '@tailor-cms/interfaces/comment';
import { computed } from 'vue';
import { emojiShortcode } from '../Emoji/emoji';
import EmojiCard from '../Emoji/EmojiCard.vue';
import EmojiGlyph from '../Emoji/EmojiGlyph.vue';

const props = withDefaults(
  defineProps<{
    emoji: string;
    reactions: Reaction[];
    currentUserId?: number | null;
  }>(),
  { currentUserId: null },
);

const emit = defineEmits<{ toggle: [] }>();

const isCurrentUserReaction = computed(() =>
  props.reactions.some((it) => it.userId === props.currentUserId),
);

const listNames = (names: string[]) => {
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;
};

const nameOf = ({ userId, user }: Reaction) => {
  if (userId === props.currentUserId) return 'you';
  return user?.label ?? 'Someone';
};

const who = computed(() => {
  const names = props.reactions.map(nameOf);
  if (names[0] === 'you') names[0] = 'You';
  return listNames(names);
});

const label = computed(() => emojiShortcode(props.emoji) ?? props.emoji);

const description = computed(() => `${who.value} reacted with ${label.value}`);
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

.reaction-tooltip-verb {
  opacity: 0.65;
}
</style>
