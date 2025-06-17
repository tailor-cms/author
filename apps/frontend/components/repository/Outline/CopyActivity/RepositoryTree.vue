<template>
  <VTextField
    v-model="search"
    :placeholder="`Filter selected ${schemaName}...`"
    clear-icon="mdi-close-circle-outline"
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
  >
    <template #prepend="{ item }">
      <VIcon
        v-if="item.selectable"
        :class="[isSelectable(item) ? 'opacity-100' : 'opacity-50']"
        :disabled="!isSelectable(item)"
        color="primary"
        @click.stop="toggleSelection(item)"
      >
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
import { cloneDeep, compact, xorBy } from 'lodash-es';
import { computed, ref } from 'vue';
import type { Activity } from '@tailor-cms/interfaces/activity';
import { activity as activityUtils } from '@tailor-cms/utils';
import { VTreeview } from 'vuetify/labs/VTreeview';

interface TreeItem extends Activity {
  title: string;
  level: number;
  selectable: boolean;
  children?: TreeItem[];
}

const props = defineProps<{
  schemaName: string;
  activities: Activity[];
  supportedLevels: string[];
}>();

const emit = defineEmits(['change']);

const search = ref('');
const selected = ref<TreeItem[]>([]);
const { $schemaService } = useNuxtApp() as any;

const expandedActivityIds = computed(() => props.activities.map((it) => it.id));

const activityTree = computed<TreeItem[]>(() => {
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

const toggleSelection = (activity: TreeItem) => {
  selected.value = xorBy(selected.value, [activity], 'id');
  emit('change', selected.value);
};

const isSelected = (item: TreeItem) => {
  return selected.value.find(({ id }) => id === item.id);
};

const isSelectable = (item: TreeItem) => {
  return !selected.value.length || selected.value[0].level === item.level;
};

const attachActivityAttrs = (activity: TreeItem) => {
  const hasChildren = !!$schemaService.getLevel(activity.type).subLevels.length;
  return {
    id: activity.id,
    title: activity.data.name,
    selectable: props.supportedLevels.includes(activity.type),
    ...(!hasChildren && { children: undefined }),
  };
};
</script>

<style lang="scss" scoped>
.v-treeview {
  max-height: 31.25rem;
}

.v-list {
  border-radius: 4px !important;
}
</style>
