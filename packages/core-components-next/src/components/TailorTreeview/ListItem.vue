<template>
  <VListItem
    v-bind="$attrs"
    :class="{ 'text-secondary-lighten-4': isActive }"
    :title="title"
    class="list-item"
    @click="onItemClick"
  >
    <template #prepend>
      <VIcon v-if="isGroup" :color="prependColor">
        {{ prependIcon }}
      </VIcon>
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
import { computed, defineProps } from 'vue';

const props = defineProps<{
  id: number;
  title: string;
  isGroup?: boolean;
  isEditable?: boolean;
  isOpen?: boolean;
  isActive?: boolean;
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
.list-item ::v-deep .v-list-item__append {
  i {
    opacity: 1 !important;
  }
}
</style>
