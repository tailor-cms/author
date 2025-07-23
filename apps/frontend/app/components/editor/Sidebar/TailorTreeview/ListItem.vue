<template>
  <VListItem
    ref="listItem"
    v-bind="omit(activatorProps, 'onClick')"
    :class="{ 'list-item-active': isActive, 'pt-2': isHovered }"
    :create-context="createContext"
    :title="title"
    class="list-item"
    @click.prevent="onItemClick"
  >
    <template #prepend>
      <VBtn
        v-if="isGroup"
        :color="prependColor"
        :icon="prependIcon"
        class="ml-n1 mr-2"
        density="comfortable"
        variant="text"
        @click.stop="activatorProps?.onClick"
      />
    </template>
    <template #title>
      <span :class="{ 'font-weight-bold': isActive }">{{ title }}</span>
    </template>
    <template #subtitle>
      <VExpandTransition>
        <ItemToolbar
          v-if="isHovered || createContext?.activity?.id === id"
          :id="id"
          @create="emit('create', $event)"
          @edit="emit('edit', $event)"
        />
      </VExpandTransition>
    </template>
    <template #append>
      <div v-if="isHovered" class="d-flex flex-column align-center">
        <VBtn
          color="primary-lighten-2"
          icon="mdi-chevron-up"
          density="compact"
          variant="text"
          @click.stop="reoder(Direction.Up)"
        />
        <VBtn
          color="primary-lighten-2"
          icon="mdi-chevron-down"
          density="compact"
          variant="text"
          @click.stop="reoder(Direction.Down)"
        />
      </div>
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue';
import { omit } from 'lodash-es';
import { useElementHover } from '@vueuse/core';
import ItemToolbar from './ItemToolbar.vue';

const Direction = {
  Up: -1,
  Down: 1,
};

const props = defineProps<{
  id: number;
  title: string;
  isGroup?: boolean;
  isEmpty?: boolean;
  isEditable?: boolean;
  isOpen?: boolean;
  isActive?: boolean;
  activatorProps?: Record<string, any>;
  createContext?: { activity: any };
  // Location of the item in the list
  index: number;
  // Siblings of the item in the list
  siblings: any[];
}>();

const emit = defineEmits(['create', 'edit']);

const activityStore = useActivityStore();

const listItem = useTemplateRef<HTMLButtonElement>('listItem');
const isHovered = useElementHover(listItem, {
  delayEnter: 800,
  delayLeave: 2000,
});

const prependIcon = computed(() => {
  if (!props.isGroup) return '';
  const icon = props.isOpen ? 'mdi-folder-open' : 'mdi-folder';
  return props.isEmpty ? `${icon}-outline` : icon;
});

const prependColor = computed(() => {
  return props.isOpen ? 'primary-lighten-3' : 'primary-lighten-2';
});

const onItemClick = (e: any) => {
  if (!props.isEditable) return props.activatorProps?.onClick(e);
  emit('edit', props.id);
};

const reoder = (direction: number) => {
  const activity = activityStore.findById(props.id) as any;
  return activityStore.reorder(activity, {
    items: props.siblings,
    position: props.index + direction,
  });
};
</script>
