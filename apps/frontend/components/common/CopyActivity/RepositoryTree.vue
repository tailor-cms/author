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
    ref="tree"
    :items="activityTree"
    :opened="expandedActivityIds"
    :search="search"
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
  <VAlert v-if="noResultsMessage" color="primary-darken-2" variant="tonal">
    {{ noResultsMessage }}
  </VAlert>
</template>

<script lang="ts" setup>
import { defineProps, ref, computed, watch } from 'vue';
import { activity as activityUtils } from '@tailor-cms/utils';

import { VTreeview } from 'vuetify/labs/VTreeview';
import type { Activity } from '@/api/interfaces/activity';
import xorBy from 'lodash/xorBy';

interface TreeItem {
  id: string;
  title: string;
  isEditable: boolean;
  children?: Array<TreeItem>;
}

const props = defineProps<{
  schemaName: string;
  activities: Array<Activity>;
  supportedLevels: Array<number>;
}>();

const emit = defineEmits(['change']);

const search = ref('');
const tree = ref();
const selected = ref([]);
const { $schemaService } = useNuxtApp() as any;

const expandedActivityIds = computed(() => props.activities.map((it) => it.id));

const activityTree = computed<Array<TreeItem>>(() => {
  return activityUtils.toTreeFormat(props.activities, {
    filterNodesFn: $schemaService.filterOutlineActivities,
    processNodeFn: attachActivityAttrs,
  });
});

const noResultsMessage = computed(() => {
  if (!props.activities?.length) return `Selected ${props.schemaName} is empty`;
  if (!search.value || !!activityTree.value.length) return '';
  return 'No matches found';
});

const toggleSelection = (activity) =>{
  selected.value = xorBy(selected.value, [activity], 'id');
  emit('change', selected.value);
};

const isSelected = (item) => selected.value.find(it => it.id === item.id)
const isSelectable = (item) => !selected.value.length || (selected.value[0].level === item.level)

const attachActivityAttrs = (activity: Activity) => ({
  id: activity.id,
  title: activity.data.name,
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
