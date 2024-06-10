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
      :items="activityTree"
      :search="search"
      class="py-3 px-1 treeview"
      item-type=""
      item-value="id"
      open-all
    >
      <template #title="{ item: { id, name } }">
        {{ name }}
        <v-chip
          v-if="groupedSelection[id]"
          class="readonly custom-chip"
          rounded
          small
        >
          {{ getChipLabel(groupedSelection[id]) }}
        </v-chip>
      </template>
      <template #append="{ item }">
        <VBtn
          v-if="hasContentContainers(item.type)"
          color="primary-darken-2"
          size="small"
          variant="outlined"
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

const props = defineProps<Props>();
defineEmits(['selected']);

const search = ref('');
const treeview = ref();
const schemaService = inject('$schemaService') as any;

const groupedSelection = computed(() =>
  groupBy(props.selectedElements, 'outlineId'),
);

const activityTree = computed<Array<ActivityTree>>(() => {
  return toTreeFormat(props.activities, {
    filterNodesFn: schemaService.filterOutlineActivities,
    processNodeFn: undefined,
  });
});

const noResultsMessage = computed(() => {
  if (!props.activities?.length) return 'Empty repository';
  if (!search.value || treeview.value) return '';
  const { excludedItems, nodes } = treeview.value;
  const hasSearchResults = excludedItems.size !== Object.keys(nodes).length;
  return !hasSearchResults && 'No matches found';
});

const hasContentContainers = (type: string) => {
  return schemaService.isEditable(type);
};

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
