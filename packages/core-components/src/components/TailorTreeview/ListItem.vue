<template>
  <VListItem
    v-bind="omit(activatorProps, 'onClick')"
    :class="{
      'list-item-active': isActive,
      'readonly': !isEditable,
    }"
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
        @click="activatorProps?.onClick"
      />
    </template>
    <template #title>
      <span :class="{ 'font-weight-bold': isActive }">{{ title }}</span>
    </template>
    <template #append>
      <VIcon v-if="isEditable" color="secondary-lighten-4">
        mdi-page-next-outline
      </VIcon>
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import omit from 'lodash/omit';

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

const prependIcon = computed(() => {
  if (!props.isGroup) return '';
  const icon = props.isOpen ? 'mdi-folder-open' : 'mdi-folder';
  return props.isEmpty ? `${icon}-outline` : icon;
});

const prependColor = computed(() => {
  return props.isOpen ? 'primary-lighten-3' : 'primary-lighten-2';
});

const onItemClick = () => {
  if (!props.isEditable) return;
  emit('edit', props.id);
};
</script>

<style scoped lang="scss">
.list-item :deep(.v-list-item__append) {
  i {
    opacity: 1 !important;
  }
}

.list-item.readonly {
  pointer-events: none;

  .v-btn {
    pointer-events: auto;
  }
}

.list-item-active {
  color: #f9c2d5;
}
</style>
