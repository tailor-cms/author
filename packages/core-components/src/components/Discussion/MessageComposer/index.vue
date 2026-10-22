<template>
  <div
    :class="{ 'is-focused': isFocused, 'is-dragging': isDragging }"
    class="message-composer"
    @dragenter.prevent="isDragging = canAttach"
    @dragleave.prevent="endDrag"
    @dragover.prevent
    @drop.prevent="attachDropped"
  >
    <ComposerInput
      ref="inputEl"
      v-model="content"
      :autofocus="autofocus"
      :disabled="disabled"
      :placeholder="placeholder"
      @blur="isFocused = false"
      @edit:last="emit('edit:last')"
      @focus="onFocus"
      @paste="attachPasted"
      @submit="submit"
      @update:model-value="onInput"
    />
    <VProgressLinear
      v-if="isUploading"
      class="mt-1"
      color="primary"
      height="2"
      indeterminate
    />
    <div class="d-flex align-center px-2 pb-2">
      <AttachButton
        v-if="canAttach"
        :disabled="disabled || isUploading"
        @attach="attachFiles"
      />
      <EmojiPicker :disabled="disabled" @select="insertEmoji" />
      <ComposerHint
        :is-dragging="isDragging"
        :is-uploading="isUploading"
        :overflow="overflow"
        :submit-label="isEditing ? 'save' : 'send'"
      />
      <VSpacer />
      <VBtn
        v-if="!isEditing"
        :disabled="isEmpty || isTooLong || disabled"
        aria-label="Post message"
        color="primary"
        density="comfortable"
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
import {
  MESSAGE_MAX_LENGTH,
  ReferenceType,
} from '@tailor-cms/interfaces/comment';
import { computed, ref } from 'vue';
import { referenceNode, withSpace } from './tiptap/document';
import { useDiscussionContext } from '../context';
import AttachButton from './AttachButton.vue';
import ComposerHint from './ComposerHint.vue';
import ComposerInput from './ComposerInput.vue';
import EmojiPicker from '../Emoji/EmojiPicker.vue';

interface Props {
  placeholder?: string;
  disabled?: boolean;
  autofocus?: boolean;
  // Editing a posted message
  isEditing?: boolean;
  maxLength?: number;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Write a message...',
  disabled: false,
  autofocus: false,
  isEditing: false,
  maxLength: MESSAGE_MAX_LENGTH,
});

const emit = defineEmits<{
  'submit': [content: string];
  'typing': [];
  'focus': [];
  // Up arrow in an empty composer, to edit your last message
  'edit:last': [];
}>();

const { services } = useDiscussionContext();

// Message text, with mentions and references as tokens
const content = defineModel<string>({ default: '' });

const inputEl = ref<InstanceType<typeof ComposerInput>>();
const isFocused = ref(false);
const isDragging = ref(false);
const isUploading = ref(false);
const isEmpty = computed(() => !content.value);
// Characters past the limit
const overflow = computed(() =>
  Math.max(0, content.value.length - props.maxLength),
);
const isTooLong = computed(() => overflow.value > 0);
const canAttach = computed(() => !!services);

const onFocus = () => {
  isFocused.value = true;
  emit('focus');
};

const onInput = (value: string) => {
  if (value) emit('typing');
};

const insertEmoji = (value: string) => inputEl.value?.insert(`${value} `);

// Files go to the asset library and are added as chips
const attachFiles = async (files: File[]) => {
  if (!files.length || !canAttach.value || isUploading.value) return;
  isUploading.value = true;
  try {
    const attachments = (await services?.uploadFiles(files)) ?? [];
    inputEl.value?.insert(
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
  if (!files.length || !canAttach.value) return;
  event.preventDefault();
  attachFiles(files);
};

const submit = () => {
  if (props.disabled || isEmpty.value || isTooLong.value) return;
  emit('submit', content.value);
  // Cleared for the next message, along with the draft
  inputEl.value?.clear();
};

const focus = () => inputEl.value?.focus();

defineExpose({ focus, submit });
</script>

<style lang="scss" scoped>
.message-composer {
  position: relative;
  min-width: 0;
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
  min-height: var(--composer-min-height, auto);
  max-height: 12rem;
  padding: 0.75rem 1rem;
}
</style>
