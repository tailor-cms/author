<template>
  <VListGroup v-if="item.isGroup" :value="item.id">
    <template #activator="{ props: activatorProps, isOpen }">
      <ListItem
        v-bind="{ ...bindings, isOpen, activatorProps }"
        :is-empty="!item.children.length"
        is-group
        @edit="emit('edit', $event)"
      />
    </template>
    <Draggable
      :data-parent-id="item.id"
      :list="item.children"
      :move="repositoryStore.isValidDrop"
      animation="150"
      group="activities"
      item-key="uid"
      @update="(data: SortableEvent) => reorder(data, item.children)"
      @change="(e: ChangeEvent) => repositoryStore.onOutlineItemDrop(e, item.id)"
    >
      <template #item="{ element }">
        <ItemGroup
          :active-item-id="activeItemId"
          :item="element"
          @edit="emit('edit', $event)"
        />
      </template>
    </Draggable>
  </VListGroup>
  <ListItem v-else v-bind="bindings" @edit="emit('edit', $event)" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import Draggable from 'vuedraggable';

import type { ChangeEvent, SortableEvent } from '@/types/draggable';
import ItemGroup from './ItemGroup.vue';
import ListItem from './ListItem.vue';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  item: any;
  activeItemId: number;
}>();

const emit = defineEmits(['edit']);

const repositoryStore = useCurrentRepository();
const reorder = useOutlineReorder();

const bindings = computed(() => {
  const { id, isEditable, title } = props.item;
  return {
    id,
    title,
    isEditable,
    isActive: props.activeItemId === id,
  };
});
</script>

<style lang="scss" scoped>
.v-list-group {
  --list-indent-size: 0.75rem;
}
</style>
