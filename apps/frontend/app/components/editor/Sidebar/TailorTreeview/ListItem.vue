<template>
  <VExpandTransition>
    <VListItem
      ref="listItem"
      v-bind="omit(activatorProps, 'onClick')"
      :class="{ 'list-item-active': isActive }"
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
      <template #append>
        <ActivityMenu
          v-show="isHovered || isMenuOpen"
          v-model="isMenuOpen"
          :activity="activity"
          activator-size="x-small"
          class="activity-menu ml-2"
          @click.stop
        />
      </template>
    </VListItem>
  </VExpandTransition>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue';
import { omit } from 'lodash-es';
import { useElementHover } from '@vueuse/core';
import type { Activity } from '@tailor-cms/interfaces/activity';

import ActivityMenu from '~/components/common/ActivityOptions/ActivityMenu.vue';

const props = defineProps<{
  id: number;
  title: string;
  isGroup?: boolean;
  isEmpty?: boolean;
  isEditable?: boolean;
  isOpen?: boolean;
  isActive?: boolean;
  activatorProps?: Record<string, any>;
}>();

const emit = defineEmits(['edit']);

const activityStore = useActivityStore();

const listItem = useTemplateRef<HTMLButtonElement>('listItem');
const isHovered = useElementHover(listItem);
const isMenuOpen = ref(false);

const activity = activityStore.findById(props.id) as Activity;

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
</script>

<style lang="scss" scoped>
.list-item {
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.activity-menu {
  :deep(.v-list-item-title),
  :deep(.v-list-item-title:hover) {
    color: rgb(var(--v-theme-primary-darken-3)) !important;
    font-weight: 400 !important;
  }
}

.v-list-item:hover .activity-menu :deep(.v-list-item__content) .v-list-item-title {
  font-weight: 400 !important;
}
</style>
