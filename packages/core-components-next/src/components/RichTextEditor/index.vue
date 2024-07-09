<template>
  <VInput
    ref="input"
    :disabled="disabled"
    :focused="focused"
    :model-value="modelValue"
    :rules="rules"
    class="text-left"
  >
    <template #default="{ id, isValid, isDisabled, isDirty }">
      <VField
        :id="id.value"
        :active="focused || isDirty.value"
        :disabled="isDisabled.value"
        :error="isValid.value === false"
        :focused="focused"
        :label="label"
        :variant="variant"
      >
        <template #default="{ props: fieldProps }">
          <div class="w-100">
            <EditorContent
              v-bind="fieldProps"
              ref="input"
              :editor="editor"
              class="w-100"
            />
            <VDivider />
            <EditorToolbar :editor="editor" />
          </div>
        </template>
      </VField>
    </template>
  </VInput>
</template>

<script lang="ts" setup>
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { ref, watch } from 'vue';
import type { VField, VInput } from 'vuetify/components';
import CharacterCount from '@tiptap/extension-character-count';
import StarterKit from '@tiptap/starter-kit';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Underline from '@tiptap/extension-underline';
import { useFocusWithin } from '@vueuse/core';

import EditorToolbar from './EditorToolbar.vue';

interface Props {
  modelValue: string;
  label: string;
  disabled: boolean;
  variant?: VField['variant'];
  rules?: VInput['rules'];
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'outlined',
  disabled: false,
  rules: undefined,
});
const emit = defineEmits(['update:modelValue']);

const input = ref();
const { focused } = useFocusWithin(input);

const editor = useEditor({
  content: props.modelValue,
  onUpdate: ({ editor }) => {
    const content = editor.storage.characterCount.words()
      ? editor.getHTML()
      : '';
    return emit('update:modelValue', content);
  },
  extensions: [
    StarterKit.configure({ heading: false, horizontalRule: false }),
    Subscript,
    Superscript,
    Underline,
    CharacterCount.configure(),
  ],
});

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value!) return;
    const isSame = editor.value.getHTML() === value;
    return !isSame && editor.value?.commands.setContent(value, false);
  },
);
</script>

<style lang="scss" scoped>
$toolbar-height: 2.25rem;

:deep(.ProseMirror) {
  overflow-y: auto;
  outline: none;
  width: 100%;

  ul,
  ol {
    padding: 0 1rem;
  }

  pre {
    background: #0d0d0d;
    color: #fff;
    font-family: 'JetBrainsMono', monospace;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.8rem;
    }
  }

  blockquote {
    padding-left: 1rem;
    border-left: 2px solid color-mix(in srgb, currentColor 20%, transparent);
  }
}

.v-field--center-affix :deep(.v-label.v-field-label) {
  top: calc(50% - $toolbar-height/2);
}
</style>
