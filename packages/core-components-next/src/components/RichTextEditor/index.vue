<template>
  <VInput ref="input" v-bind="$attrs" :model-value="modelValue">
    <VSheet
      v-if="editor"
      :class="{ active, focused }"
      class="editor w-100"
      color="transparent"
      rounded="sm"
    >
      <VFieldLabel :floating="active">{{ label }}</VFieldLabel>
      <EditorContent :editor="editor" />
      <VDivider />
      <EditorToolbar :editor="editor" />
      <div class="outline">
        <div class="outline-start"></div>
        <div class="outline-notch">
          <VFieldLabel :floating="active">{{ label }}</VFieldLabel>
        </div>
        <div class="outline-end"></div>
      </div>
    </VSheet>
  </VInput>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Underline from '@tiptap/extension-underline';
import { useFocusWithin } from '@vueuse/core';

import EditorToolbar from './EditorToolbar.vue';

const props = defineProps<{ modelValue: string; label: string }>();
const emit = defineEmits(['update:modelValue']);

const input = ref();
const { focused } = useFocusWithin(input);

const editor = useEditor({
  content: props.modelValue,
  onUpdate: () => emit('update:modelValue', editor.value?.getHTML()),
  extensions: [StarterKit, Subscript, Superscript, Underline],
});

const active = computed(() => focused.value || !!editor.value?.getText());

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
.editor {
  text-align: left;
  position: relative;
  border-radius: 4px;

  &.active .outline .v-label {
    visibility: unset;
  }

  .v-field-label {
    margin: 0 1rem;
  }

  &.focused .outline {
    --opacity: 1;
    --width: 2px;
  }

  .outline {
    pointer-events: none;
    display: flex;
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    --opacity: 0.38;
    --width: 1px;

    .v-field-label {
      visibility: hidden;
      opacity: var(--opacity);
    }

    .v-field-label.v-field-label--floating {
      visibility: unset;
      transform: translateY(-50%);
      transform-origin: center;
      position: static;
      margin: 0 4px;
    }
  }

  .outline-start {
    flex: 0 0 0.75rem;
    border: var(--width) solid currentColor;
    opacity: var(--opacity);
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    border-right: none;
  }

  .outline-notch {
    position: relative;
    max-width: calc(100% - 12px);

    &:before,
    &:after {
      border: 0 solid currentColor;
      content: '';
      opacity: var(--opacity);
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    &:before {
      opacity: 0;
      top: 0;
      border-width: var(--width) 0 0;
    }

    &:after {
      bottom: 0;
      border-width: 0 0 var(--width);
    }
  }

  .outline-end {
    flex: 1;
    border: var(--width) solid currentColor;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    border-left: none;
    opacity: var(--opacity);
  }
}

:deep(.ProseMirror) {
  overflow-y: auto;
  padding: 0.75rem 1rem;
  outline: none;
}
</style>
