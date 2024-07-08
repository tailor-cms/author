<template>
  <VInput :value="modelValue">
    <VLabel>label</VLabel>
    <VBtnGroup>
      <VBtn>Bold</VBtn>
      <VBtn>Italic</VBtn>
    </VBtnGroup>
    <EditorContent :editor="editor" />
  </VInput>
</template>

<script lang="ts" setup>
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { watch } from 'vue';

const props = defineProps<{ modelValue: string, label: string }>();
const emit = defineEmits(['update:modelValue']);

const editor = useEditor({
  content: props.modelValue,
  onUpdate: () => emit('update:modelValue', editor.value?.getHTML()),
  extensions: [StarterKit],
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
