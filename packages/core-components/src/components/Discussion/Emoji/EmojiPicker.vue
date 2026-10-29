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
    <VCard color="surface-raised" class="emoji-picker" width="340">
      <VTextField
        v-model="query"
        bg-color="surface-container-high"
        class="mx-3 mt-3 mb-1"
        density="compact"
        placeholder="Search emoji"
        prepend-inner-icon="mdi-magnify"
        rounded="lg"
        variant="solo"
        autofocus
        clearable
        flat
        hide-details
      />
      <VTabs
        v-if="!query"
        :model-value="currentGroup"
        color="secondary"
        class="mx-3"
        density="compact"
        height="32"
        grow
        @update:model-value="jumpTo"
      >
        <VTab
          v-for="{ label } in groupStarts"
          :key="label"
          v-tooltip:top="label"
          :aria-label="label"
          :value="label"
          class="px-0"
          min-width="0"
          rounded="lg"
        >
          <VIcon :icon="groupIcon(label)" />
        </VTab>
      </VTabs>
      <VDivider />
      <div class="bg-surface-overlay">
        <VVirtualScroll
          v-if="rows.length"
          ref="scrollEl"
          :items="rows"
          max-height="18rem"
          @scroll.passive="onScroll"
        >
          <template #default="{ item, index }">
            <div
              v-if="item.label"
              class="emoji-group-label px-3 pt-2 pb-1 text-body-small"
            >
              {{ item.label }}
            </div>
            <div :data-row="index" class="emoji-grid px-2">
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
      </div>
    </VCard>
  </VMenu>
</template>

<script lang="ts" setup>
import type { CustomEmoji } from '../types';

import { EMOJI_GROUPS, type EmojiEntry, searchEmoji } from './emoji';
import { chunk, find, findLast, last } from 'lodash-es';
import { computed, ref } from 'vue';
import type { VVirtualScroll } from 'vuetify/components';
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
const COLUMNS = 9;
// A row showing less than this at the top counts as scrolled past
const ROW_PEEK_PX = 8;

const GROUP_ICONS: Record<string, string> = {
  Custom: 'star',
  Smileys: 'emoticon',
  People: 'account',
  Nature: 'paw',
  Food: 'food-apple',
  Travel: 'car',
  Activities: 'trophy',
  Objects: 'lightbulb',
  Symbols: 'heart',
  Flags: 'flag',
};

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

// Where each group starts, for the category strip
const groupStarts = computed(() =>
  rows.value.flatMap(({ label }, index) => (label ? [{ label, index }] : [])),
);

const scrollEl = ref<InstanceType<typeof VVirtualScroll>>();
const scrolledGroup = ref<string>();
const currentGroup = computed(
  () => scrolledGroup.value ?? groupStarts.value[0]?.label,
);

// Filled when selected, outlined otherwise
const groupIcon = (label: string) => {
  const name = GROUP_ICONS[label] ?? 'emoticon';
  return `mdi-${name}${label === currentGroup.value ? '' : '-outline'}`;
};

const jumpTo = (label: unknown) => {
  const start = groupStarts.value.find((it) => it.label === label);
  if (!start) return;
  scrolledGroup.value = start.label;
  scrollEl.value?.scrollToIndex(start.index);
  scrollEl.value?.$el.animate([{ opacity: 0.4 }, { opacity: 1 }], {
    duration: 150,
    easing: 'ease-out',
  });
};

// The group of the first row in view; at the end, the last group, whose
// label may never reach the top
const findCurrentGroup = (el: HTMLElement) => {
  const isAtEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
  if (isAtEnd) return last(groupStarts.value)?.label;
  const top = el.getBoundingClientRect().top;
  const rowEls = el.querySelectorAll<HTMLElement>('[data-row]');
  const row = find(
    rowEls,
    (it) => it.getBoundingClientRect().bottom > top + ROW_PEEK_PX,
  );
  const index = Number(row?.dataset.row ?? 0);
  return findLast(groupStarts.value, (it) => it.index <= index)?.label;
};

// The virtual scroll redraws the rows in view on the next frame, so they
// are read on the one after
const onScroll = (e: Event) => {
  const el = e.target as HTMLElement;
  const update = () => (scrolledGroup.value = findCurrentGroup(el));
  requestAnimationFrame(() => requestAnimationFrame(update));
};

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
  grid-template-columns: repeat(9, 1fr);
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
