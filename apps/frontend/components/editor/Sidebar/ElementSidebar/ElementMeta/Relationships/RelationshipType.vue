<template>
  <VListItem class="pa-4" variant="tonal" rounded>
    <VListItemTitle>{{ label }}</VListItemTitle>
    <VListItemSubtitle>{{ overview }}</VListItemSubtitle>
    <template #append>
      <VListItemAction>
        <VTooltip location="bottom">
          <template #activator="{ props: tooltipProps }">
            <VBtn
              v-bind="tooltipProps"
              :class="{ 'mr-3': hasRelationships }"
              :icon="hasRelationships ? 'mdi-pencil' : 'mdi-plus'"
              color="teal-lighten-3"
              size="small"
              variant="tonal"
              @click="showElementBrowser = true"
            />
          </template>
          <span>{{ placeholder || defaultPlaceholder }}</span>
        </VTooltip>
        <VTooltip v-if="hasRelationships" location="bottom">
          <template #activator="{ props: tooltipProps }">
            <VBtn
              v-bind="tooltipProps"
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
    <SelectElement
      v-if="showElementBrowser"
      :allowed-types="allowedTypes"
      :heading="defaultPlaceholder"
      :multiple="multiple"
      :selected="value"
      header-icon="mdi-transit-connection-variant"
      only-current-repo
      @close="showElementBrowser = false"
      @selected="select"
    />
  </VListItem>
</template>

<script lang="ts" setup>
import { computed, defineEmits, defineProps, ref } from 'vue';
import pluralize from 'pluralize';
import { SelectElement } from '@tailor-cms/core-components-next';

import type { Activity } from '@/api/interfaces/activity';
import type { ContentElement } from '@/api/interfaces/content-element';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';

const getTotalsByActivity = (activities: Activity[], relationships: any[]) => {
  return activities.reduce((acc, activity) => {
    const { id, data } = activity;
    const { length } = relationships.filter((it) => it.outlineId === id);
    return length ? [...acc, `${data.name} (${length})`] : acc;
  }, [] as Array<string>);
};

interface Props {
  label: string;
  placeholder?: string;
  multiple?: boolean;
  allowedTypes?: Array<any>;
  value?: Array<any>;
}

const props = withDefaults(defineProps<Props>(), {
  allowedTypes: () => [],
  value: () => [],
  placeholder: '',
  multiple: true,
});
const emit = defineEmits(['save']);

const showElementBrowser = ref(false);
const curentRepository = useCurrentRepository();

const activities = computed(() => curentRepository.activities);
const hasRelationships = computed(() => !!props.value.length);
const defaultPlaceholder = computed(() => {
  return `Select element${props.multiple ? 's' : ''}`;
});
const overview = computed(() => {
  return hasRelationships.value
    ? getTotalsByActivity(activities.value, props.value).join(', ')
    : '';
});

const showConfirmationDialog = useConfirmationDialog();

const removeAll = () => {
  let label = props.label.toLowerCase();
  label = props.multiple ? pluralize(label) : label;
  showConfirmationDialog({
    title: `Remove ${label}?`,
    message: `Are you sure you want to remove ${label}?`,
    action: () => emit('save', []),
  });
};

const select = (elements: ContentElement[]) => {
  const items = elements.map((it) => {
    if (!it.activity) return it;
    const { id, activity, activityId: containerId } = it;
    return { id, containerId, outlineId: activity.id };
  });
  emit('save', items);
};
</script>

<style lang="scss" scoped>
.v-list-item + .v-list-item {
  margin-top: 0.25rem;
}
</style>
