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
      <div class="emoji-picker-scroll">
        <template v-for="group in groups" :key="group.label">
          <div class="emoji-group-label px-3 pt-2 text-body-small">
            {{ group.label }}
          </div>
          <div class="emoji-grid px-2 pb-2">
            <button
              v-for="{ value, title } in group.items"
              :key="value"
              :title="title"
              class="emoji-cell"
              type="button"
              @click="select(value)"
            >
              <EmojiGlyph :value="value" />
            </button>
          </div>
        </template>
        <div
          v-if="!groups.length"
          class="px-3 py-4 text-body-small text-medium-emphasis"
        >
          No emoji matches that.
        </div>
      </div>
    </VCard>
  </VMenu>
</template>

<script lang="ts" setup>
import type { CustomEmoji } from '../types';

import { EMOJI_GROUPS, type EmojiEntry, searchEmoji } from './emoji';
import { computed, ref } from 'vue';
import { toEmojiShortcode } from '@tailor-cms/utils';
import { useCustomEmoji } from '../useCustomEmoji';
import EmojiGlyph from '../EmojiGlyph.vue';

interface PickerItem {
  value: string;
  title: string;
}

interface PickerGroup {
  label: string;
  items: PickerItem[];
}

defineProps<{ disabled?: boolean }>();

const emit = defineEmits<{ select: [value: string] }>();

const CUSTOM_LIMIT = 32;
const RESULT_LIMIT = 60;

const toItem = ({ char, shortcode }: EmojiEntry): PickerItem => ({
  value: char,
  title: toEmojiShortcode(shortcode),
});

const toCustomItem = ({ name }: CustomEmoji): PickerItem => ({
  value: toEmojiShortcode(name),
  title: toEmojiShortcode(name),
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

const select = (value: string) => {
  emit('select', value);
  isOpen.value = false;
};
</script>

<style lang="scss" scoped>
.emoji-picker-scroll {
  max-height: 18rem;
  overflow-y: auto;
}

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
