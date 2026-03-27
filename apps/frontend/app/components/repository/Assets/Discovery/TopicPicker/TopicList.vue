<template>
  <VList class="topic-list pa-2" density="compact">
    <template v-for="item in items" :key="item.id">
      <VListSubheader
        v-if="item.isGroup"
        class="text-uppercase font-weight-bold"
      >
        {{ item.name }}
      </VListSubheader>
      <VListItem
        v-else
        :prepend-icon="item.isLeaf
          ? 'mdi-file-document-outline'
          : 'mdi-folder-outline'"
        :value="item.id"
        class="topic-list-item"
        @click="emit('topic:select', item)"
      >
        <VListItemTitle class="text-body-2">
          {{ item.name }}
        </VListItemTitle>
        <VListItemSubtitle v-if="item.parentName" class="text-caption">
          {{ item.parentName }}
        </VListItemSubtitle>
      </VListItem>
    </template>
  </VList>
</template>

<script lang="ts" setup>
import type { TopicItem } from './types';

defineProps<{
  items: TopicItem[];
}>();

const emit = defineEmits<{
  'topic:select': [topic: TopicItem];
}>();
</script>

<style lang="scss" scoped>
.topic-list {
  max-height: 30rem;
  overflow-y: auto;
}

.topic-list-item {
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
}
</style>
