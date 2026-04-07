<template>
  <div class="d-flex align-center ga-3">
    <VMenu
      v-model="isOpen"
      :close-on-content-click="false"
      offset="2"
      max-height="600"
      min-width="480"
    >
      <template #activator="{ props: menuProps }">
        <VBtn
          v-bind="menuProps"
          :color="modelValue ? 'teal-lighten-3' : 'primary-lighten-3'"
          prepend-icon="mdi-file-tree-outline"
          size="small"
          variant="tonal"
        >
          {{ modelValue ? modelValue.name : 'Search by topic' }}
          <VIcon end>mdi-chevron-down</VIcon>
        </VBtn>
      </template>
      <VCard min-width="360">
        <VCardTitle class="text-body-2">Select outline topic</VCardTitle>
        <VDivider />
        <TopicList :items="items" @topic:select="onSelect" />
      </VCard>
    </VMenu>
    <VChip
      v-if="modelValue"
      color="teal-lighten-3"
      size="small"
      variant="tonal"
      closable
      @click:close="emit('topic:clear')"
    >
      {{ modelValue.name }}
    </VChip>
  </div>
</template>

<script lang="ts" setup>
import TopicList from './TopicList.vue';
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

const isOpen = ref(false);

function onSelect(topic: TopicItem) {
  isOpen.value = false;
  emit('update:modelValue', topic);
}
</script>
