<template>
  <VTextField
    v-model="search"
    :disabled="!activities?.length"
    clear-icon="mdi-close-circle-outline"
    placeholder="Filter items..."
    prepend-inner-icon="mdi-filter-outline"
    variant="outlined"
    clearable
  />
  <VTreeview
    v-show="!noResultsMessage"
    ref="treeview"
    :items="processedItems"
    :opened="expandedActivityIds"
    :search="search"
    base-color="primary-darken-3"
    item-type=""
    item-value="id"
    max-height="300"
    nav
    open-all
    @click:select="selectActivity($event.id as number)"
  >
    <template #append="{ item }">
      <VChip
        v-if="groupedSelection[item.id]"
        class="ml-2"
        color="teal-darken-1"
        size="small"
      >
        {{ getChipLabel(groupedSelection[item.id].length) }}
      </VChip>
      <VIcon
        v-if="item.isEditable"
        class="ml-2"
        color="primary"
        icon="mdi-chevron-right"
      />
    </template>
  </VTreeview>
  <VAlert v-if="noResultsMessage" color="primary-darken-2" variant="tonal">
    {{ noResultsMessage }}
  </VAlert>
</template>

<script lang="ts" setup>
import { computed, defineProps, inject, ref } from 'vue';
import { activity as activityUtils } from '@tailor-cms/utils';
import cloneDeep from 'lodash/cloneDeep';
import groupBy from 'lodash/groupBy';
import pluralize from 'pluralize';
import { VTreeview } from 'vuetify/labs/VTreeview';

import type {
  ContentElement,
  Relationship,
} from '../../interfaces/content-element';
import type { Activity } from '../../interfaces/activity';

interface TreeItem {
  id: string;
  title: string;
  isEditable: boolean;
  children?: Array<TreeItem>;
}

interface Props {
  selectedElements?: Array<ContentElement | Relationship>;
  activities?: Array<Activity>;
}

const props = withDefaults(defineProps<Props>(), {
  selectedElements: () => [],
  activities: () => [],
});
const emit = defineEmits(['selected']);

const search = ref('');
const treeview = ref();
const schemaService = inject<any>('$schemaService');

const expandedActivityIds = computed(() => props.activities.map((it) => it.id));

const groupedSelection = computed(() => {
  return groupBy(props.selectedElements, 'outlineId');
});

const activityTree = computed<Array<TreeItem>>(() => {
  return activityUtils.toTreeFormat(props.activities, {
    filterNodesFn: schemaService.filterOutlineActivities,
    processNodeFn: attachActivityAttrs,
  });
});

const selectActivity = (id: number) => {
  const activity = props.activities.find((it) => it.id === id);
  emit('selected', activity);
};

const processedItems = computed(() => {
  if (!search.value) return activityTree.value;
  const items = cloneDeep(activityTree.value);
  return items.map(searchRecursive).filter(Boolean) as TreeItem[];
});

const noResultsMessage = computed(() => {
  if (!props.activities?.length) return 'Empty repository';
  if (!search.value || !!processedItems.value.length) return '';
  return 'No matches found';
});

const doesTitleMatchSearch = (title: string) => {
  return title.toLowerCase().includes(search.value.toLowerCase());
};

const searchRecursive = (item: TreeItem) => {
  if (doesTitleMatchSearch(item.title)) return item;
  if (!item.children) return false;
  const children = item.children
    .map(searchRecursive)
    .filter(Boolean) as TreeItem[];
  if (children.length) return { ...item, children };
  return false;
};

const attachActivityAttrs = (activity: Activity) => ({
  id: activity.id,
  title: activity.data.name,
  isEditable: !!schemaService.isEditable(activity.type),
  ...(schemaService.isEditable(activity.type) && { children: undefined }),
});

const getChipLabel = (length: number) => {
  return `${pluralize('element', length, true)} selected`;
};
</script>

<style lang="scss" scoped>
.v-list {
  border-radius: 4px !important;
  background: rgba(var(--v-theme-primary-darken-2), 0.12);
}
</style>
