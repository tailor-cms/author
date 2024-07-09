<template>
  <VListItem
    v-bind="omit(activatorProps, 'onClick')"
    :class="{ 'text-secondary-lighten-4': isActive }"
    :title="title"
    class="list-item"
    @click="onItemClick"
  >
    <template #prepend>
      <VBtn
        v-if="isGroup"
        :color="prependColor"
        :icon="prependIcon"
        class="mr-2"
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
  isEditable?: boolean;
  isOpen?: boolean;
  isActive?: boolean;
  activatorProps?: Record<string, any>;
}>();

const emit = defineEmits(['edit']);

const prependIcon = computed(() => {
  return props.isGroup ? (props.isOpen ? 'mdi-folder-open' : 'mdi-folder') : '';
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
</style>
