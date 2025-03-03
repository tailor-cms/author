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
    :items="processedItems"
    :opened="expandedActivityIds"
    base-color="primary-darken-3"
    class="pa-0"
    item-type=""
    item-value="id"
    border
    open-all
    rounded
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
  <VAlert
    v-if="noResultsMessage"
    color="primary-darken-2"
    icon="mdi-information-outline"
    variant="tonal"
  >
    {{ noResultsMessage }}
  </VAlert>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import { cloneDeep, compact, groupBy } from 'lodash-es';
import type {
  ContentElement,
  Relationship,
} from '@tailor-cms/interfaces/content-element';
import type { Activity } from '@tailor-cms/interfaces/activity';
import { activity as activityUtils } from '@tailor-cms/utils';
import pluralize from 'pluralize-esm';
import { VTreeview } from 'vuetify/labs/VTreeview';

interface TreeItem extends Activity {
  id: number;
  name?: string;
  title: string;
  label: string;
  isEditable: boolean;
  children?: TreeItem[];
}

interface Props {
  selectedElements?: (ContentElement | Relationship)[];
  activities?: Activity[];
}

const props = withDefaults(defineProps<Props>(), {
  selectedElements: () => [],
  activities: () => [],
});
const emit = defineEmits(['selected']);

const search = ref('');
const schemaService = inject<any>('$schemaService');

const expandedActivityIds = computed(() => props.activities.map((it) => it.id));

const groupedSelection = computed(() => {
  return groupBy(props.selectedElements, 'outlineId');
});

const activityTree = computed(() => {
  return activityUtils.toTreeFormat(props.activities, {
    filterNodesFn: schemaService.filterOutlineActivities,
    processNodeFn: attachActivityAttrs,
  }) as TreeItem[];
});

const selectActivity = (id: number) => {
  const activity = props.activities.find((it) => it.id === id);
  emit('selected', activity);
};

const processedItems = computed(() => {
  if (!search.value) return activityTree.value;
  const items = cloneDeep(activityTree.value);
  return compact(items.map(searchRecursive));
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
  const children: TreeItem[] = compact(item.children.map(searchRecursive));
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
.v-treeview {
  max-height: 31.25rem;
}
</style>
