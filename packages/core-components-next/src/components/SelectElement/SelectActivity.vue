<template>
  <div class="mx-3">
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
      class="py-3 px-1 treeview bg-transparent"
      item-type=""
      item-value="id"
      open-all
    >
      <template #append="{ item }">
        <VChip
          v-if="groupedSelection[item.id]"
          class="readonly custom-chip mx-2"
          color="teal-lighten-1"
          size="small"
        >
          {{ getChipLabel(groupedSelection[item.id].length) }}
        </VChip>
        <VBtn
          v-if="item.isEditable"
          color="primary"
          size="small"
          variant="tonal"
          @click="$emit('selected', item)"
        >
          View elements
        </VBtn>
      </template>
    </VTreeview>
    <VAlert v-if="noResultsMessage" color="primary-darken-2">
      {{ noResultsMessage }}
    </VAlert>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps, inject, ref } from 'vue';
import { activity as activityUtils } from '@tailor-cms/utils';
import cloneDeep from 'lodash/cloneDeep';
import groupBy from 'lodash/groupBy';
import pluralize from 'pluralize';
import { VTreeview } from 'vuetify/labs/VTreeview';

import type { Activity } from '../../interfaces/activity';
import type { ContentElement } from '../../interfaces/content-element';

const { toTreeFormat } = activityUtils;

interface Props {
  selectedElements?: Array<ContentElement>;
  activities?: Array<Activity>;
}

interface ActivityTree {
  id: string;
  name: string;
  type: string;
  children: Array<ActivityTree>;
}

const props = withDefaults(defineProps<Props>(), {
  selectedElements: () => [],
  activities: () => [],
});
defineEmits(['selected']);

const search = ref('');
const treeview = ref();
const schemaService = inject('$schemaService') as any;

const groupedSelection = computed(() =>
  groupBy(props.selectedElements, 'outlineId'),
);

const expandedActivityIds = computed(() => props.activities.map((it) => it.id));

const processedItems = computed(() => {
  if (!search.value) return activityTree.value;
  const items = cloneDeep(activityTree.value);
  return items.map(searchRecursive).filter(Boolean);
});

const doesTitleMatchSearch = (title: string) =>
  title.toLowerCase().includes(search.value.toLowerCase());

const searchRecursive = (item: any): any => {
  if (doesTitleMatchSearch(item.title)) return item;
  const filteredChildren = item.children?.map(searchRecursive).filter(Boolean);
  if (filteredChildren?.length) return { ...item, children: filteredChildren };
  return false;
};
const attachActivityAttrs = (activity: Activity) => ({
  id: activity.id,
  title: activity.data.name,
  isEditable: !!schemaService.isEditable(activity.type),
  ...(schemaService.isEditable(activity.type) && { children: undefined }),
});

const activityTree = computed<Array<ActivityTree>>(() => {
  return toTreeFormat(props.activities, {
    filterNodesFn: schemaService.filterOutlineActivities,
    processNodeFn: attachActivityAttrs,
  });
});

const noResultsMessage = computed(() => {
  if (!props.activities?.length) return 'Empty repository';
  if (!search.value || !!processedItems.value.length) return '';
  return 'No matches found';
});

const getChipLabel = (length: number) => {
  return `${pluralize('element', length, true)} selected`;
};
</script>

<style lang="scss" scoped>
.treeview {
  border: 1px solid #eee;
  max-height: 19rem;
  background-color: #fcfcfc;
  text-align: left;
  overflow-y: scroll;

  .v-chip.custom-chip {
    border-radius: 12px !important;
  }

  ::v-deep .v-treeview-node {
    &--leaf > &__root,
    &--leaf > &__content > * {
      cursor: auto;
    }
  }
}
</style>
