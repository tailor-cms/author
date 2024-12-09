<template>
  <VInput
    v-if="editor"
    ref="input"
    v-bind="{ disabled, focused, readonly, rules }"
    :model-value="content"
    class="text-left"
  >
    <template #default="{ id, isValid, isReadonly, isDisabled, isDirty }">
      <VField
        :id="id.value"
        :active="focused || isDirty.value"
        :disabled="isDisabled.value"
        :error="isValid.value === false"
        :focused="focused"
        :label="label"
        :readonly="isReadonly.value"
        :variant="variant"
      >
        <template #default="{ props: fieldProps }">
          <div class="w-100">
            <EditorContent v-bind="fieldProps" :editor="editor" class="w-100" />
            <VDivider />
            <EditorToolbar
              :disabled="isDisabled.value"
              :editor="editor"
              :readonly="isReadonly.value"
            />
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
  modelValue: any;
  label?: string;
  disabled?: boolean;
  variant?: VField['variant'];
  rules?: VInput['rules'];
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  disabled: false,
  readonly: false,
  variant: undefined,
  rules: undefined,
});
const emit = defineEmits(['update:model-value', 'change']);

const input = ref();
const content = ref(props.modelValue);
const { focused } = useFocusWithin(input);

const editor = useEditor({
  content: content.value,
  editorProps: {
    attributes: { role: 'textbox' },
  },
  onUpdate: ({ editor }) => {
    content.value = editor.storage.characterCount.words()
      ? editor.getHTML()
      : '';
    return emit('update:model-value', content.value);
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
    if (!editor.value) return;
    const isSame = editor.value.getHTML() === value;
    return !isSame && editor.value?.commands.setContent(value, false);
  },
);

watch(focused, async (val) => {
  if (val || props.modelValue === content.value) return;
  return emit('change', content.value);
});

watch(
  () => props.readonly || props.disabled,
  (val) => editor.value?.setEditable(!val),
);
</script>

<style lang="scss" scoped>
$toolbar-height: 2.25rem;

:deep(.ProseMirror) {
  overflow-y: auto;
  outline: none;
  width: 100%;

  > * + * {
    margin-top: 0.75em;
  }

  ul,
  ol {
    padding: 0 1rem;
  }

  pre {
    background: #0d0d0d;
    color: #fff;
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

.v-field--center-affix {
  :deep(.v-label.v-field-label:not(.v-field-label--floating)) {
    top: calc(50% - $toolbar-height/2);
  }
}
</style>
