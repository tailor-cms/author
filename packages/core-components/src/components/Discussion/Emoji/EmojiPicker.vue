<template>
  <VMenu
    v-model="isOpen"
    :close-on-content-click="false"
    location="top start"
    @after-leave="query = ''"
  >
    <template #activator="{ props: menuProps }">
      <slot name="activator" v-bind="{ props: menuProps }">
        <VBtn
          v-tooltip:top="'Add an emoji'"
          v-bind="menuProps"
          :disabled="disabled"
          aria-label="Add an emoji"
          class="mr-1"
          density="comfortable"
          icon="mdi-emoticon-outline"
          size="small"
          variant="text"
        />
      </slot>
    </template>
    <VCard class="emoji-picker" elevation="8" rounded="lg" width="320">
      <div class="pa-2">
        <VTextField
          v-model="query"
          density="compact"
          placeholder="Search emoji"
          prepend-inner-icon="mdi-magnify"
          rounded="lg"
          variant="solo-filled"
          autofocus
          clearable
          flat
          hide-details
        />
      </div>
      <VDivider />
      <VVirtualScroll v-if="rows.length" :items="rows" max-height="18rem">
        <template #default="{ item }">
          <div
            v-if="item.label"
            class="emoji-group-label px-3 pt-2 pb-1 text-body-small"
          >
            {{ item.label }}
          </div>
          <div class="emoji-grid px-2">
            <button
              v-for="{ value, title, isCustom } in item.items"
              :key="value"
              :title="title"
              class="emoji-cell"
              type="button"
              @click="select(value)"
            >
              <EmojiGlyph v-if="isCustom" :value="value" />
              <span v-else class="emoji-char">{{ value }}</span>
            </button>
          </div>
        </template>
      </VVirtualScroll>
      <div v-else class="px-3 py-4 text-body-small text-medium-emphasis">
        No emoji matches that.
      </div>
    </VCard>
  </VMenu>
</template>

<script lang="ts" setup>
import type { CustomEmoji } from '../types';

import { EMOJI_GROUPS, type EmojiEntry, searchEmoji } from './emoji';
import { computed, ref } from 'vue';
import { chunk } from 'lodash-es';
import { toEmojiShortcode } from '@tailor-cms/utils';
import { useCustomEmoji } from './useCustomEmoji';
import EmojiGlyph from './EmojiGlyph.vue';

interface PickerItem {
  value: string;
  title: string;
  isCustom?: boolean;
}

interface PickerGroup {
  label: string;
  items: PickerItem[];
}

// A row of emoji; a group's first row carries its label
interface PickerRow {
  label?: string;
  items: PickerItem[];
}

defineProps<{ disabled?: boolean }>();

const emit = defineEmits<{ select: [value: string] }>();

const CUSTOM_LIMIT = 32;
const RESULT_LIMIT = 60;
const COLUMNS = 8;

const toItem = ({ char, shortcode }: EmojiEntry): PickerItem => ({
  value: char,
  title: toEmojiShortcode(shortcode),
});

const toCustomItem = ({ name }: CustomEmoji): PickerItem => ({
  value: toEmojiShortcode(name),
  title: toEmojiShortcode(name),
  isCustom: true,
});

const ALL_GROUPS: PickerGroup[] = EMOJI_GROUPS.map(({ label, entries }) => ({
  label,
  items: entries.map(toItem),
}));

const customEmoji = useCustomEmoji();

const isOpen = ref(false);
const query = ref<string | null>('');

const groups = computed<PickerGroup[]>(() => {
  const term = query.value ?? '';
  const custom = customEmoji.search(term, CUSTOM_LIMIT).map(toCustomItem);
  const standard = term
    ? [{ label: 'Results', items: searchEmoji(term, RESULT_LIMIT).map(toItem) }]
    : ALL_GROUPS;
  return [{ label: 'Custom', items: custom }, ...standard].filter(
    (it) => it.items.length,
  );
});

// Rows, so only those in view are drawn
const rows = computed<PickerRow[]>(() => groups.value.flatMap(({ label, items }) =>
  chunk(items, COLUMNS).map((row, i) => ({
    label: i === 0 ? label : undefined,
    items: row,
  })),
));

const select = (value: string) => {
  emit('select', value);
  isOpen.value = false;
};
</script>

<style lang="scss" scoped>
.emoji-group-label {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.125rem;
  padding-bottom: 0.125rem;
}

// Drawn as an emoji, like EmojiGlyph's characters
.emoji-char {
  font-variant-emoji: emoji;
  font-size: 1.25em;
  line-height: 1;
}

.emoji-cell {
  aspect-ratio: 1;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  font-size: 1rem;
  line-height: 1;

  &:hover,
  &:focus-visible {
    background: rgba(var(--v-theme-primary), 0.12);
  }
}
</style>
