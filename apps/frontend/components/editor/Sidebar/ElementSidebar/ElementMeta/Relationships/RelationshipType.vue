<template>
  <VListItem v-show="!disableSidebarUi" class="pa-4" variant="tonal" rounded>
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
      :element="element"
      :filters="filters"
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
import { computed, ref } from 'vue';
import type {
  ContentElement,
  Relationship,
} from '@tailor-cms/interfaces/content-element';
import type { Filter } from '@tailor-cms/interfaces/schema';
import pluralize from 'pluralize';
import { SelectElement } from '@tailor-cms/core-components-next';

import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';

interface Props {
  label: string;
  element: ContentElement;
  placeholder?: string;
  multiple?: boolean;
  allowedTypes?: string[];
  filters?: Filter[];
  value?: Relationship[];
  disableSidebarUi?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  allowedTypes: () => [],
  filters: () => [],
  value: () => [],
  placeholder: '',
  multiple: true,
  disableSidebarUi: false,
});
const emit = defineEmits(['save']);

const showElementBrowser = ref(false);
const curentRepository = useCurrentRepository();
const contentElementStore = useContentElementStore();
const showConfirmationDialog = useConfirmationDialog();
const editorBus = useEditorBus();

const activities = computed(() => curentRepository.activities);

const hasRelationships = computed(() => !!props.value.length);

const defaultPlaceholder = computed(() => {
  return `Select element${props.multiple ? 's' : ''}`;
});

const totalsByActivity = computed(() => {
  return activities.value.reduce((acc, { id, data }) => {
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

const select = (elements: ContentElement[]) => {
  // Add linked elements to the store
  elements.forEach((it) => contentElementStore.add(it));
  const items = elements.map((it) => {
    if (!it.activity) return it;
    const { id, activity, activityId: containerId } = it;
    return { id, containerId, outlineId: activity.id };
  });
  emit('save', items);
};

editorBus.on('element:link', () => (showElementBrowser.value = true));
</script>

<style lang="scss" scoped>
.v-list-item + .v-list-item {
  margin-top: 0.25rem;
}

.v-list-item.v-list-item--one-line .v-list-item-subtitle {
  -webkit-line-clamp: unset;
}
</style>
