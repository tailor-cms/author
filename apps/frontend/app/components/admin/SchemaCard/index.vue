<template>
  <VCard class="mb-3" color="surface-sunken" rounded="lg" flat>
    <VCardItem
      :aria-expanded="isExpanded"
      class="schema-header py-3 px-4"
      role="button"
      tabindex="0"
      @click="emit('toggle')"
      @keydown.enter.space.prevent="emit('toggle')"
    >
      <VCardTitle class="text-title-medium">{{ schema.label }}</VCardTitle>
      <VCardSubtitle v-if="schema.description" class="text-body-small">
        {{ schema.description }}
      </VCardSubtitle>
      <template #append>
        <VChip
          v-if="schema.collection"
          class="mr-2 flex-shrink-0"
          color="tertiary"
          prepend-icon="mdi-view-grid-outline"
          rounded="lg"
          size="small"
          text="Collection"
          variant="tonal"
        />
        <VChip
          v-if="schema.languages"
          v-tooltip:bottom="schema.languages.names"
          :text="schema.languages.codes"
          class="mr-2 flex-shrink-0"
          prepend-icon="mdi-translate"
          rounded="lg"
          size="small"
          variant="tonal"
        />
        <VIcon
          :class="{ 'rotate-180': isExpanded }"
          class="expand-icon"
          icon="mdi-chevron-down"
        />
      </template>
    </VCardItem>
    <VExpandTransition>
      <div v-if="isExpanded" class="schema-tree d-flex flex-column pa-6 pt-0">
        <SchemaTreeItem
          v-for="item in schema.children"
          :key="item.id"
          :item="item"
        />
      </div>
    </VExpandTransition>
  </VCard>
</template>

<script lang="ts" setup>
import SchemaTreeItem from './SchemaTreeItem.vue';
import type { SchemaCardData } from './types';

defineProps<{
  schema: SchemaCardData;
  isExpanded: boolean;
}>();

const emit = defineEmits<{ toggle: [] }>();
</script>

<style lang="scss" scoped>
.schema-header {
  cursor: pointer;
}

.expand-icon {
  transition: transform 0.2s ease;

  &.rotate-180 {
    transform: rotate(180deg);
  }
}

.schema-tree {
  gap: 0.375rem;
}
</style>
