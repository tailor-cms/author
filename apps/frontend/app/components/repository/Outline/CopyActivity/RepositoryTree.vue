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
    v-show="!emptyState"
    :items="processedItems"
    :opened="expandedActivityIds"
    density="compact"
    class="pa-0"
    open-all
    rounded
  >
    <template #prepend="{ item }">
      <VIcon
        v-if="item.selectable"
        :class="[
          'activity-select-checkbox',
          isSelectable(item) ? 'opacity-100' : 'opacity-50',
        ]"
        :icon="isSelected(item)
          ? 'mdi-checkbox-marked'
          : 'mdi-checkbox-blank-outline'
        "
        :disabled="!isSelectable(item)"
        @click.stop="toggleSelection(item)"
      />
    </template>
  </VTreeview>
  <TailorEmptyState
    v-if="emptyState"
    :icon="emptyState.icon"
    :text="emptyState.text"
    :title="emptyState.title"
  />
</template>

<script lang="ts" setup>
import { cloneDeep, compact, xorBy } from 'lodash-es';
import { computed, ref } from 'vue';
import type { Activity } from '@tailor-cms/interfaces/activity';
import { activity as activityUtils } from '@tailor-cms/utils';
import { TailorEmptyState } from '@tailor-cms/core-components';

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
  }) as TreeItem[];
});

const processedItems = computed(() => {
  if (!search.value) return activityTree.value;
  const items = cloneDeep(activityTree.value);
  return compact(items.map(searchRecursive));
});

const emptyState = computed(() => {
  if (!props.activities?.length)
    return {
      icon: 'mdi-file-tree-outline',
      title: `Selected ${props.schemaName} is empty`,
      text: '',
    };
  if (!search.value || !!processedItems.value.length) return null;
  return {
    icon: 'mdi-magnify',
    title: 'No matches found',
    text: 'Try adjusting your filter.',
  };
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
  return !selected.value.length || selected.value[0]!.level === item.level;
};

const attachActivityAttrs = (activity: Activity) => {
  const hasChildren = !!$schemaService.getLevel(activity.type).subLevels.length;
  return {
    value: activity.id,
    title: activity.data.name,
    selectable: props.supportedLevels.includes(activity.type),
    type: undefined,
    ...(!hasChildren && { children: undefined }),
  };
};
</script>

<style lang="scss" scoped>
.v-treeview {
  max-height: 31.25rem;
}
</style>
