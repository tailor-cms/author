<template>
  <VSheet color="transparent" rounded="0">
    <VBtn
      :active="editor?.isActive('bold')"
      icon="mdi-format-bold"
      rounded="sm"
      size="28"
      variant="text"
      @click="editor?.chain().focus().toggleBold().run()"
    />
    <VBtn
      :active="editor?.isActive('italic')"
      icon="mdi-format-italic"
      rounded="sm"
      size="28"
      variant="text"
      @click="editor?.chain().focus().toggleItalic().run()"
    />
    <VBtn
      :active="editor?.isActive('underline')"
      icon="mdi-format-underline"
      rounded="sm"
      size="28"
      variant="text"
      @click="editor?.chain().focus().toggleUnderline().run()"
    />
    <VBtn
      :active="editor?.isActive('strike')"
      icon="mdi-format-strikethrough-variant"
      rounded="sm"
      size="28"
      variant="text"
      @click="editor?.chain().focus().toggleStrike().run()"
    />
    <VDivider vertical />
    <VBtn
      :active="editor?.isActive('bulletList')"
      icon="mdi-format-list-bulleted"
      rounded="sm"
      size="28"
      variant="text"
      @click="editor?.chain().focus().toggleBulletList().run()"
    />
    <VBtn
      :active="editor?.isActive('orderedList')"
      icon="mdi-format-list-numbered"
      rounded="sm"
      size="28"
      variant="text"
      @click="editor?.chain().focus().toggleOrderedList().run()"
    />
    <VDivider vertical />
    <VBtn
      :active="editor?.isActive('subscript')"
      icon="mdi-format-subscript"
      rounded="sm"
      size="28"
      variant="text"
      @click="editor?.chain().focus().toggleSubscript().run()"
    />
    <VBtn
      :active="editor?.isActive('superscript')"
      icon="mdi-format-superscript"
      rounded="sm"
      size="28"
      variant="text"
      @click="editor?.chain().focus().toggleSuperscript().run()"
    />
    <VDivider vertical />
    <VBtn
      :active="editor?.isActive('blockquote')"
      icon="mdi-format-quote-open"
      rounded="sm"
      size="28"
      variant="text"
      @click="editor?.chain().focus().toggleBlockquote().run()"
    />
    <VBtn
      :active="editor?.isActive('codeBlock')"
      icon="mdi-code-tags"
      rounded="sm"
      size="28"
      variant="text"
      @click="editor?.chain().focus().toggleCodeBlock().run()"
    />
  </VSheet>
</template>

<script lang="ts" setup>
defineProps<{ editor: any }>();
</script>

<style lang="scss" scoped>
.v-sheet {
  display: flex;
  padding: 0.25rem;
  gap: 0.125rem;

  .v-divider {
    margin: 0 0.125rem;
  }
}

.v-btn {
  color: currentColor !important;

  :deep(.v-icon) {
    font-size: 1.24rem !important;
  }
}
</style>
