<template>
  <div class="schema-item-wrapper">
    <VListItem
      :ripple="false"
      :style="{ '--row-accent': item.color }"
      class="schema-item bg-surface-raised"
      elevation="1"
    >
      <template v-if="hasChildren" #prepend>
        <VIcon icon="mdi-folder-open" size="20" />
      </template>
      <div class="item-name">
        <span class="text-truncate">{{ item.label }}</span>
        <VChip
          v-if="item.recursive"
          v-tooltip:bottom="'This type can contain more of itself'"
          class="ml-2 flex-shrink-0"
          prepend-icon="mdi-replay"
          rounded="lg"
          size="x-small"
          text="Self-nesting"
          variant="tonal"
        />
      </div>
    </VListItem>
    <div v-if="hasChildren" class="schema-tree d-flex flex-column">
      <SchemaTreeItem
        v-for="child in item.children"
        :key="child.id"
        :item="child"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TreeItem } from './types';

const props = defineProps<{
  item: TreeItem;
}>();

const hasChildren = computed(() => !!props.item.children?.length);
</script>

<style lang="scss" scoped>
.schema-item {
  height: 2.5rem;
  min-height: 2.5rem;
  padding: 0 0.75rem 0 0.625rem;
  border-radius: 0.25rem;
  border-left: 6px solid
    var(--row-accent, rgb(var(--v-theme-surface-container-high)));

  :deep(.v-list-item__prepend) {
    width: 2rem;
  }

  .item-name {
    display: flex;
    align-items: center;
    padding: 0 0.75rem 0 0.25rem;
    font-size: 0.875rem;

    .text-truncate {
      min-width: 0;
    }
  }
}

.schema-item-wrapper .schema-item-wrapper {
  margin-left: 1rem;
}

.schema-tree {
  gap: 0.375rem;
  margin-top: 0.375rem;
}
</style>
