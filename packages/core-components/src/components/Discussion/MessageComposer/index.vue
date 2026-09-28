<template>
  <div
    :class="{ 'is-focused': isFocused, 'is-dragging': isDragging }"
    class="message-composer"
    @dragenter.prevent="isDragging = canAttach"
    @dragleave.prevent="endDrag"
    @dragover.prevent
    @drop.prevent="attachDropped"
  >
    <EditorContent
      :class="{ 'composer-input--search': isSearch }"
      :editor="editor"
      class="composer-input"
      @paste="attachPasted"
    />
    <VProgressLinear
      v-if="isUploading"
      class="mt-1"
      color="primary"
      height="2"
      indeterminate
    />
    <div v-if="!isSearch" class="d-flex align-center px-2 pb-2">
      <AttachButton
        v-if="uploadFiles"
        :disabled="disabled || isUploading"
        @attach="attachFiles"
      />
      <EmojiPicker :disabled="disabled" @select="insertEmoji" />
      <ComposerHint
        :is-dragging="isDragging"
        :is-uploading="isUploading"
        :submit-label="isEditing ? 'save' : 'send'"
      />
      <VSpacer />
      <VBtn
        v-if="!isEditing"
        :disabled="isEmpty || disabled"
        aria-label="Post message"
        color="primary"
        icon="mdi-send"
        rounded="lg"
        size="small"
        variant="flat"
        @click="submit"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Attachment, SuggestionFetcher, SuggestionItem } from '../keys';

import { ReferenceType, toEmojiShortcode } from '@tailor-cms/utils';
import {
  referenceNode,
  serialize,
  toDocument,
  withSpace,
} from './tiptap/document';
import { EditorContent, type JSONContent, useEditor } from '@tiptap/vue-3';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { createExtensions } from './tiptap/extensions';
import { searchEmoji } from '../EmojiPicker/emoji';
import { useCustomEmoji } from '../useCustomEmoji';
import AttachButton from './AttachButton.vue';
import ComposerHint from './ComposerHint.vue';
import EmojiPicker from '../EmojiPicker/index.vue';

interface Props {
  // `search` makes it a search box: the same autocomplete, but no action
  // row, no typing signal
  variant?: 'message' | 'search';
  placeholder?: string;
  disabled?: boolean;
  autofocus?: boolean;
  // Editing a posted message
  isEditing?: boolean;
  suggestUsers?: SuggestionFetcher;
  suggestReferences?: SuggestionFetcher;
  // Uploads to the asset library and returns what to reference
  uploadFiles?: (files: File[]) => Promise<Attachment[]>;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'message',
  placeholder: 'Write a message...',
  disabled: false,
  autofocus: false,
  isEditing: false,
  suggestUsers: () => [],
  suggestReferences: () => [],
  uploadFiles: undefined,
});

const emit = defineEmits<{
  'submit': [content: string];
  'typing': [];
  'focus': [];
  // Up arrow in an empty composer, to edit your last message
  'edit:last': [];
}>();

const customEmoji = useCustomEmoji();

// Message text, with mentions and references as tokens
const content = defineModel<string>({ default: '' });

const isFocused = ref(false);
const isDragging = ref(false);
const isUploading = ref(false);
const isSearch = computed(() => props.variant === 'search');
const isEmpty = computed(() => !content.value);
const canAttach = computed(() => !!props.uploadFiles);

const openMenus = new Set<string>();
const CUSTOM_EMOJI_LIMIT = 10;

const suggestEmoji = (query: string): SuggestionItem[] => [
  ...customEmoji.search(query, CUSTOM_EMOJI_LIMIT).map((it) => ({
    value: toEmojiShortcode(it.name),
    label: it.name,
    avatar: it.url,
  })),
  ...searchEmoji(query).map((it) => ({
    value: it.char,
    label: `${it.char}  ${it.shortcode}`,
  })),
];

const editor = useEditor({
  editable: !props.disabled,
  autofocus: props.autofocus,
  // A saved draft or the message being edited
  content: toDocument(content.value),
  editorProps: {
    attributes: { 'role': 'textbox', 'aria-label': 'Message' },
    handleKeyDown: (_view, event) => {
      if (openMenus.size) return false;
      if (event.key === 'ArrowUp' && isEmpty.value) {
        emit('edit:last');
        return true;
      }
      if (event.key !== 'Enter' || event.shiftKey) return false;
      submit();
      return true;
    },
  },
  extensions: createExtensions({
    placeholder: () => props.placeholder,
    suggestUsers: (query) => props.suggestUsers(query),
    suggestReferences: (query) => props.suggestReferences(query),
    suggestEmoji,
    hooks: {
      onOpen: (char) => openMenus.add(char),
      onClose: (char) => openMenus.delete(char),
    },
  }),
  onFocus: () => {
    isFocused.value = true;
    emit('focus');
  },
  onBlur: () => {
    isFocused.value = false;
  },
  onUpdate: ({ editor }) => {
    content.value = serialize(editor);
    if (content.value && !isSearch.value) emit('typing');
  },
});

// Adds an emoji or attachment chips at the cursor
const insert = (value: string | JSONContent[]) =>
  editor.value?.chain().focus().insertContent(value).run();

const insertEmoji = (value: string) => insert(`${value} `);

// Files go to the asset library and are added as chips
const attachFiles = async (files: File[]) => {
  const { uploadFiles } = props;
  if (!files.length || !uploadFiles || isUploading.value) return;
  isUploading.value = true;
  try {
    const attachments = await uploadFiles(files);
    insert(
      attachments.flatMap(({ id, label }) =>
        withSpace(referenceNode(ReferenceType.Asset, id, label)),
      ),
    );
  } finally {
    isUploading.value = false;
  }
};

const endDrag = ({ currentTarget, relatedTarget }: DragEvent) => {
  const composer = currentTarget as HTMLElement;
  // `dragleave` also fires when the drag moves onto a child, e.g. from
  // the text onto the button row. Only leaving the composer ends it
  const isStillInside = composer.contains(relatedTarget as Node | null);
  if (!isStillInside) isDragging.value = false;
};

const attachDropped = ({ dataTransfer }: DragEvent) => {
  isDragging.value = false;
  attachFiles(Array.from(dataTransfer?.files ?? []));
};

// Pasted text is left to the editor; only files are attached
const attachPasted = (event: ClipboardEvent) => {
  const files = Array.from(event.clipboardData?.files ?? []);
  if (!files.length) return;
  event.preventDefault();
  attachFiles(files);
};

const submit = () => {
  if (!editor.value || props.disabled) return;
  const text = serialize(editor.value);
  if (!text) return;
  emit('submit', text);
  // A search query stays, so it can be refined. A sent message is
  // cleared for the next one; `true` also clears `v-model` and the draft
  if (isSearch.value) return;
  editor.value.commands.clearContent(true);
};

// Changed from outside, e.g. a draft restored or cleared by the parent
watch(content, (value) => {
  if (!editor.value || value === serialize(editor.value)) return;
  editor.value.commands.setContent(toDocument(value), { emitUpdate: false });
});

watch(
  () => props.disabled,
  (value) => editor.value?.setEditable(!value),
);

const focus = () => editor.value?.commands.focus('end');

defineExpose({ focus });

onBeforeUnmount(() => editor.value?.destroy());
</script>

<style lang="scss" scoped>
.message-composer {
  // Lets the hint fit itself to the composer's width
  container-type: inline-size;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0.75rem;
  background: rgb(var(--v-theme-surface));
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &.is-focused {
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
  }

  &.is-dragging {
    border-color: rgb(var(--v-theme-secondary));
    border-style: dashed;
    background: rgba(var(--v-theme-secondary), 0.06);
  }
}

.composer-input {
  max-height: 12rem;
  padding: 0.75rem 0.875rem 0.25rem;
  overflow-y: auto;
  font-size: 0.875rem;

  &--search {
    max-height: 5rem;
    padding: 0.5rem 0.75rem;
  }

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
