<template>
  <VListItem
    :title="label"
    :subtitle="overview"
    class="element-relationship px-5 py-3 bg-surface-container"
    rounded
  >
    <template #append>
      <VListItemAction>
        <VBtn
          v-tooltip:bottom="placeholder"
          :aria-label="`${hasRelationships ? 'Edit' : 'Add'} Relationship`"
          :icon="hasRelationships ? 'mdi-pencil-box-outline' : 'mdi-plus'"
          size="x-small"
          variant="tonal"
          @click="$emit('open')"
        />
        <VBtn
          v-if="hasRelationships"
          v-tooltip:bottom="'Clear All'"
          aria-label="Remove Relationship"
          class="ml-2"
          color="error"
          icon="mdi-close"
          size="x-small"
          variant="tonal"
          @click="removeAll"
        />
      </VListItemAction>
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import pluralize from 'pluralize-esm';
import type { Relationship } from '@tailor-cms/interfaces/content-element';

import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';

interface Props {
  label: string;
  placeholder?: string;
  multiple?: boolean;
  value?: Relationship[];
}

const props = withDefaults(defineProps<Props>(), {
  allowedTypes: () => [],
  value: () => [],
  placeholder: '',
  multiple: true,
});
const emit = defineEmits(['save', 'open']);

const curentRepository = useCurrentRepository();
const showConfirmationDialog = useConfirmationDialog();

const activities = computed(() => curentRepository.activities);

const hasRelationships = computed(() => !!props.value.length);

const totalsByActivity = computed(() => {
  return activities.value.reduce((acc: any, { id, data }: any) => {
    const { length } = props.value.filter((it) => it.outlineId === id);
    return length ? [...acc, `${data.name} (${length})`] : acc;
  }, [] as string[]);
});

const overview = computed(() => {
  return hasRelationships.value ? totalsByActivity.value.join(', ') : '';
});

const removeAll = () => {
  const label = props.multiple ? pluralize(props.label) : props.label;
  showConfirmationDialog({
    title: `Remove ${label}?`,
    color: 'error',
    message: `Are you sure you want to remove ${label.toLowerCase()}?`,
    action: () => emit('save', []),
  });
};
</script>

<style lang="scss" scoped>
.v-list-item + .v-list-item {
  margin-top: 0.25rem;
}

.v-list-item.v-list-item--one-line :deep(.v-list-item-subtitle) {
  -webkit-line-clamp: unset;
}
</style>
