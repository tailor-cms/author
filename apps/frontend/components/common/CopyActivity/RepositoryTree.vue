<template>
  <VTextField
    v-model="search"
    :placeholder="`Filter selected ${schemaName}...`"
    prepend-inner-icon="mdi-filter-outline"
    clear-icon="mdi-close-circle-outline"
    clearable
    variant="outlined"
  />
  <VTreeview
    v-show="!noResultsMessage"
    :items="processedItems"
    :opened="expandedActivityIds"
    base-color="primary-darken-3"
    class="pa-0"
    item-type=""
    item-value="id"
    max-height="300"
    border
    open-all
    rounded
  >
    <template #prepend="{ item }">
      <VIcon
        v-if="item.selectable"
        :class="[isSelectable(item) ? 'opacity-100' : 'opacity-50']"
        color="primary"
        @click.stop="toggleSelection(item)"
        :disabled="!isSelectable(item)">
        mdi-checkbox-{{ isSelected(item) ? 'marked' : 'blank-outline' }}
      </VIcon>
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
import { defineProps, ref, computed } from 'vue';
import { activity as activityUtils } from '@tailor-cms/utils';

import { VTreeview } from 'vuetify/labs/VTreeview';
import type { Activity } from '@/api/interfaces/activity';
import cloneDeep from 'lodash/cloneDeep';
import compact from 'lodash/compact';
import xorBy from 'lodash/xorBy';

interface TreeItem extends Activity {
  title: string;
  level: number;
  selectable: boolean;
  children?: TreeItem[];
}

const props = defineProps<{
  id: number;
  schemaName: string;
  activities: Activity[];
  supportedLevels: any[];
}>();

const emit = defineEmits(['change']);

const search = ref('');
const selected = ref<TreeItem[]>([]);
const { $schemaService } = useNuxtApp() as any;

const expandedActivityIds = computed(() => props.activities.map((it) => it.id));

const activityTree = computed<Array<TreeItem>>(() => {
  return activityUtils.toTreeFormat(props.activities, {
    filterNodesFn: $schemaService.filterOutlineActivities,
    processNodeFn: attachActivityAttrs,
  });
});

const processedItems = computed(() => {
  if (!search.value) return activityTree.value;
  const items = cloneDeep(activityTree.value);
  return compact(items.map(searchRecursive));
});

const noResultsMessage = computed(() => {
  if (!props.activities?.length) return `Selected ${props.schemaName} is empty`;
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

const toggleSelection = (activity: TreeItem) =>{
  selected.value = xorBy(selected.value, [activity], 'id');
  emit('change', selected.value);
};

const isSelected = (item: TreeItem) => {
  return selected.value.find(it => it.id === item.id);
}

const isSelectable = (item: TreeItem) => {
  return !selected.value.length || (selected.value[0].level === item.level);
}

const attachActivityAttrs = (activity: TreeItem) => ({
  id: activity.id,
  title: activity.data.name,
  disabled: !selected.value.length || (selected.value[0].level === activity.level),
  selectable: !!props.supportedLevels.some(it => it.type === activity.type),
  ...($schemaService.isEditable(activity.type) && { children: undefined }),
});
</script>

<style lang="scss" scoped>
.v-list {
  border-radius: 4px !important;
}

::v-deep .v-list-item--slim .v-list-item__prepend > .v-icon ~ .v-list-item__spacer {
  width: 0.25rem !important;
}
</style>
