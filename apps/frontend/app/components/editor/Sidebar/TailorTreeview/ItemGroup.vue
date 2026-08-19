<template>
  <VListGroup v-if="item.isGroup" :value="item.id">
    <template #activator="{ props: activatorProps, isOpen }">
      <ListItem
        v-bind="{ ...bindings, isOpen, activatorProps }"
        :is-empty="isEmpty"
        is-group
        @edit="emit('edit', $event)"
      />
    </template>
    <Draggable
      :data-parent-id="item.id"
      :list="item.children"
      :move="repositoryStore.isValidDrop"
      animation="150"
      class="drop-group"
      filter=".drop-group__placeholder"
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
      <template #footer>
        <div class="drop-group__placeholder text-body-small text-medium-emphasis">
          No items yet
        </div>
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

const isEmpty = computed(() => !props.item.children.length);

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
.drop-group {
  // The ghost is a real item, so a dragged item tracks drags in and out alike.
  &:has(> [data-draggable]) > .drop-group__placeholder {
    display: none;
  }

  // Mirrors how Vuetify indents nested rows within `.v-list-group__items`.
  &__placeholder {
    display: flex;
    align-items: center;
    min-height: 2.25rem;
    padding-inline-start: calc(16px + var(--indent-padding));
    pointer-events: none;
    user-select: none;
  }
}
</style>
