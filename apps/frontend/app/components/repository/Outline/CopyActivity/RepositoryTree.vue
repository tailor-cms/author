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
        :icon="checkboxIcon(item)"
        class="activity-select-checkbox checkbox-clickable"
        @click.stop="onRowClick(item)"
      />
    </template>
    <template #title="{ item, title }">
      <span
        :class="{ 'title-clickable': item.selectable }"
        @click.stop="onRowClick(item)"
      >
        {{ title }}
      </span>
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
  // Excludes just this item from a selected ancestor, however deeply
  // nested; everything else stays selected, including unrelated
  // selections elsewhere in the tree (e.g. a different module).
  if (isIncludedViaParent(activity)) {
    const ancestors = activityUtils.getAncestors(props.activities, activity);
    // Only one ancestor can be selected at a time, so this is the root
    const selectedAncestor = ancestors.find((it) => isSelected(it as TreeItem));
    const pathDown = [
      ...ancestors.slice(
        ancestors.findIndex(({ id }) => id === selectedAncestor?.id) + 1,
      ),
      activity,
    ];
    const replacement: TreeItem[] = [];
    let parentId = selectedAncestor?.id;
    for (const node of pathDown) {
      replacement.push(
        ...(activityUtils
          .getChildren(props.activities, parentId!)
          .filter(({ id }) => id !== node.id) as TreeItem[]),
      );
      parentId = node.id;
    }
    selected.value = selected.value
      .filter(({ id }) => id !== selectedAncestor?.id)
      .concat(replacement);
    emit('change', selected.value);
    return;
  }
  // Already explicitly selected: toggle it off outright.
  if (isSelected(activity)) {
    selected.value = selected.value.filter(({ id }) => id !== activity.id);
    emit('change', selected.value);
    return;
  }
  // Selecting an ancestor of something already selected widens to it:
  // drop its descendants (now covered by it) and add it. Everything
  // else selected stays untouched.
  if (containsSelectedDescendant(activity)) {
    const descendantIds = new Set(
      activityUtils.getDescendants(props.activities, activity).map(({ id }) => id),
    );
    selected.value = selected.value
      .filter(({ id }) => !descendantIds.has(id))
      .concat([activity]);
    emit('change', selected.value);
    return;
  }
  // Any other fresh pick; a whole module, a standalone page from an
  // unrelated branch, whatever level is simply added
  selected.value = xorBy(selected.value, [activity], 'id');
  emit('change', selected.value);
};

const onRowClick = (item: TreeItem) => {
  if (!item.selectable) return;
  toggleSelection(item);
};

const isSelected = (item: TreeItem) => {
  return !!selected.value.find(({ id }) => id === item.id);
};

// Ids of every descendant of a selected item
const includedViaParentIds = computed(() => {
  const ids = new Set<number>();
  const collectDescendants = (item: TreeItem) => {
    item.children?.forEach((child) => {
      ids.add(child.id);
      collectDescendants(child);
    });
  };
  selected.value.forEach(collectDescendants);
  return ids;
});

const isIncludedViaParent = (item: TreeItem) => {
  return includedViaParentIds.value.has(item.id);
};

const checkboxIcon = (item: TreeItem) => {
  if (isSelected(item)) return 'mdi-checkbox-marked';
  if (isIncludedViaParent(item)) return 'mdi-checkbox-multiple-marked-outline';
  return 'mdi-checkbox-blank-outline';
};

// True if item is an ancestor of something already selected.
const containsSelectedDescendant = (item: TreeItem): boolean => {
  if (!item.children) return false;
  return item.children.some(
    (child) => isSelected(child) || containsSelectedDescendant(child),
  );
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

:deep(.v-list-item) {
  cursor: default;
}

.checkbox-clickable {
  display: inline-flex;
  align-items: center;
  opacity: 1;
  padding-right: 0.75rem;
  margin-right: -0.75rem;
  cursor: pointer;
}

.title-clickable {
  display: inline-flex;
  align-items: center;
  width: calc(100% + 0.75rem);
  margin-left: -0.75rem;
  padding-left: 0.75rem;
  cursor: pointer;
}
</style>
