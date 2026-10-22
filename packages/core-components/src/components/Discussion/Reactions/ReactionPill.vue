<template>
  <VTooltip
    content-class="reaction-tooltip elevation-8"
    location="top"
    max-width="220"
  >
    <template #activator="{ props: tooltip }">
      <VChip
        v-bind="tooltip"
        :aria-label="description"
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
        @click="emit('toggle')"
      >
        <EmojiGlyph :value="emoji" />
        <span class="reaction-count ml-1">{{ reactions.length }}</span>
      </VChip>
    </template>
    <div class="reaction-tooltip-emoji">
      <EmojiGlyph :value="emoji" />
    </div>
    <div>
      {{ who }}
      <span class="reaction-tooltip-verb">reacted with {{ label }}</span>
    </div>
  </VTooltip>
</template>

<script lang="ts" setup>
import type { Reaction } from '@tailor-cms/interfaces/comment';
import { computed } from 'vue';
import { emojiShortcode } from '../Emoji/emoji';
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
</style>

<style lang="scss">
// The tooltip body is drawn outside this component
.v-tooltip > .v-overlay__content.reaction-tooltip {
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

.reaction-tooltip-emoji {
  margin-bottom: 0.5rem;
  font-size: 3rem;
  line-height: 1;
}

.reaction-tooltip-verb {
  opacity: 0.65;
}
</style>
