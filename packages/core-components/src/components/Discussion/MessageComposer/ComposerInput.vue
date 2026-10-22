<template>
  <EditorContent :editor="editor" class="composer-input" />
</template>

<script lang="ts" setup>
import type { SuggestionItem } from '../types';

import { EditorContent, type JSONContent, useEditor } from '@tiptap/vue-3';
import { onBeforeUnmount, watch } from 'vue';
import { serialize, toDocument } from './tiptap/document';
import { createExtensions } from './tiptap/extensions';
import { searchEmoji } from '../Emoji/emoji';
import { toEmojiShortcode } from '@tailor-cms/utils';
import { useCustomEmoji } from '../Emoji/useCustomEmoji';
import { useDiscussionContext } from '../context';

// The text box shared by the composer and the search: rich text with
// `@` mention, `#` reference and `:` emoji autocomplete
interface Props {
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  autofocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  ariaLabel: 'Message',
  disabled: false,
  autofocus: false,
});

const emit = defineEmits<{
  // Enter, unless picking from an autocomplete menu
  'submit': [];
  'focus': [];
  'blur': [];
  // Up arrow while empty
  'edit:last': [];
  // Escape, unless closing an autocomplete menu
  'escape': [];
}>();

const { services } = useDiscussionContext();
const customEmoji = useCustomEmoji();

// Text, with mentions and references as tokens
const content = defineModel<string>({ default: '' });

const openMenus = new Set<string>();
const CUSTOM_EMOJI_LIMIT = 10;

const suggestEmoji = (query: string): SuggestionItem[] => [
  ...customEmoji.search(query, CUSTOM_EMOJI_LIMIT).map((it) => ({
    value: toEmojiShortcode(it.name),
    label: toEmojiShortcode(it.name),
    emoji: toEmojiShortcode(it.name),
  })),
  ...searchEmoji(query).map((it) => ({
    value: it.char,
    label: toEmojiShortcode(it.shortcode),
    emoji: it.char,
  })),
];

const editor = useEditor({
  editable: !props.disabled,
  autofocus: props.autofocus,
  // A saved draft or the message being edited
  content: toDocument(content.value),
  editorProps: {
    attributes: { 'role': 'textbox', 'aria-label': props.ariaLabel },
    handleKeyDown: (_view, event) => {
      if (openMenus.size) return false;
      if (event.key === 'ArrowUp' && !content.value) {
        emit('edit:last');
        return true;
      }
      if (event.key === 'Escape') {
        emit('escape');
        return true;
      }
      if (event.key !== 'Enter' || event.shiftKey) return false;
      emit('submit');
      return true;
    },
  },
  extensions: createExtensions({
    placeholder: () => props.placeholder,
    suggestUsers: (query) => services?.suggestUsers(query) ?? [],
    suggestReferences: (query) => services?.suggestReferences(query) ?? [],
    suggestEmoji,
    hooks: {
      onOpen: (char) => openMenus.add(char),
      onClose: (char) => openMenus.delete(char),
    },
  }),
  onFocus: () => emit('focus'),
  onBlur: () => emit('blur'),
  onUpdate: ({ editor }) => {
    content.value = serialize(editor);
  },
});

// Adds an emoji or attachment chips at the cursor
const insert = (value: string | JSONContent[]) =>
  editor.value?.chain().focus().insertContent(value).run();

// `true` also clears `v-model`
const clear = () => editor.value?.commands.clearContent(true);

const focus = () => editor.value?.commands.focus('end');

// Changed from outside, e.g. a draft restored or cleared by the parent
watch(content, (value) => {
  if (!editor.value || value === serialize(editor.value)) return;
  editor.value.commands.setContent(toDocument(value), { emitUpdate: false });
});

watch(
  () => props.disabled,
  (value) => editor.value?.setEditable(!value),
);

defineExpose({ insert, clear, focus });

onBeforeUnmount(() => editor.value?.destroy());
</script>

<style lang="scss" scoped>
.composer-input {
  overflow-y: auto;

  // The editor's content comes from Tiptap, outside this component's scope
  :deep(.ProseMirror) {
    outline: none;

    p {
      margin: 0;
    }

    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      height: 0;
      color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
      pointer-events: none;
    }

    // Mention and reference chips, styled like the posted `MessageToken`
    .composer-chip {
      padding: 0 0.25rem;
      border-radius: 0.25rem;
      background: rgba(var(--v-theme-on-surface), 0.06);
      color: rgb(var(--v-theme-secondary));
      font-weight: 600;
      white-space: nowrap;

      &--reference {
        color: rgb(var(--v-theme-info));
      }
    }

    // Code highlight, styled like the posted `MessageBody`
    .composer-code {
      border-radius: 0.25rem;
      background: rgba(var(--v-theme-tertiary), 0.1);
      box-shadow: inset 0 0 0 1px rgba(var(--v-theme-tertiary), 0.28);
      color: rgb(var(--v-theme-on-tertiary-container));
      font-family: monospace;

      &--block {
        background: rgba(var(--v-theme-on-surface), 0.05);
        box-shadow: none;
        color: rgb(var(--v-theme-on-surface));
      }
    }
  }
}
</style>
