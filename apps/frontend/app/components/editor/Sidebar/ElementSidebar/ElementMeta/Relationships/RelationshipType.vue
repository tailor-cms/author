<template>
  <VListItem class="element-relationship pa-4" variant="tonal" rounded>
    <VListItemTitle>{{ label }}</VListItemTitle>
    <VListItemSubtitle>{{ overview }}</VListItemSubtitle>
    <template #append>
      <VListItemAction>
        <VTooltip location="bottom">
          <template #activator="{ props: tooltipProps }">
            <VBtn
              v-bind="tooltipProps"
              :aria-label="`${hasRelationships ? 'Edit' : 'Add'} Relationship`"
              :class="{ 'mr-3': hasRelationships }"
              :icon="hasRelationships ? 'mdi-pencil' : 'mdi-plus'"
              color="teal-lighten-3"
              size="small"
              variant="tonal"
              @click="$emit('open')"
            />
          </template>
          <span>{{ placeholder }}</span>
        </VTooltip>
        <VTooltip v-if="hasRelationships" location="bottom">
          <template #activator="{ props: tooltipProps }">
            <VBtn
              v-bind="tooltipProps"
              aria-label="Remove Relationship"
              color="secondary-lighten-3"
              icon="mdi-close"
              size="small"
              variant="tonal"
              @click="removeAll"
            />
          </template>
          <span>Clear All</span>
        </VTooltip>
      </VListItemAction>
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import pluralize from 'pluralize';
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
    message: `Are you sure you want to remove ${label.toLowerCase()}?`,
    action: () => emit('save', []),
  });
};
</script>

<style lang="scss" scoped>
.v-list-item + .v-list-item {
  margin-top: 0.25rem;
}

.v-list-item.v-list-item--one-line .v-list-item-subtitle {
  -webkit-line-clamp: unset;
}
</style>
