<template>
  <VAutocomplete
    :items="items"
    :model-value="modelValue?.id ?? null"
    color="primary-lighten-3"
    density="default"
    item-title="name"
    item-value="id"
    label="Outline topic"
    min-width="550"
    max-width="550"
    placeholder="Browse topics..."
    prepend-inner-icon="mdi-file-tree-outline"
    variant="outlined"
    clearable
    hide-details
    @update:model-value="onSelect"
  >
    <template #item="{ item, props: itemProps }">
      <VListItem v-bind="itemProps" color="primary-darken-4">
        <template #prepend>
          <VIcon
            :icon="item.raw.isLeaf
              ? 'mdi-file-document-outline'
              : 'mdi-folder-outline'"
            size="small"
          />
        </template>
        <VListItemSubtitle v-if="item.raw.breadcrumb" class="text-caption">
          {{ item.raw.breadcrumb }}
        </VListItemSubtitle>
      </VListItem>
    </template>
    <template v-if="modelValue?.breadcrumb" #selection>
      <div>
        <div class="text-body-2">{{ modelValue.name }}</div>
        <div class="text-caption text-primary-lighten-3">
          {{ modelValue.breadcrumb }}
        </div>
      </div>
    </template>
  </VAutocomplete>
</template>

<script lang="ts" setup>
import type { TopicItem } from './types';
import { useOutlineTree } from './useOutlineTree';

defineProps<{
  modelValue: TopicItem | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [topic: TopicItem | null];
  'topic:clear': [];
}>();

const { items } = useOutlineTree();

function onSelect(id: number | null) {
  if (!id) {
    emit('topic:clear');
    return;
  }
  const topic = items.value.find((it) => it.id === id);
  if (topic) emit('update:modelValue', topic);
}
</script>
