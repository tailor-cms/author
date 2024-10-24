<template>
  <VSheet color="transparent" rounded="0">
    <template v-for="(group, index) in actions" :key="index">
      <VDivider v-if="index" vertical />
      <VBtn
        v-for="action in group"
        :key="action.name"
        :active="editor?.isActive(action.name)"
        :icon="action.icon"
        rounded="sm"
        size="28"
        variant="text"
        @click="editor?.chain().focus()[action.command]().run()"
      />
    </template>
  </VSheet>
</template>

<script lang="ts" setup>
import { Editor } from '@tiptap/vue-3';
import { VDivider } from 'vuetify/lib/components/index.mjs';

import { actions } from './actions';

defineProps<{ editor: Editor }>();
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
