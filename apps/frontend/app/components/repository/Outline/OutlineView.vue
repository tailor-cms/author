<template>
  <div v-if="!search">
    <Draggable
      v-if="hasActivities"
      v-bind="{ handle: '.activity' }"
      :list="rootActivities"
      :move="repositoryStore.isValidDrop"
      class="d-flex flex-column ga-2"
      animation="150"
      group="activities"
      item-key="uid"
      @update="(data: SortableEvent) => reorder(data, rootActivities)"
      @change="(e: ChangeEvent) => repositoryStore.onOutlineItemDrop(e)"
    >
      <template #item="{ element, index }">
        <OutlineItem
          :activities="outlineActivities"
          :activity="element"
          :index="index + 1"
          :level="1"
        />
      </template>
    </Draggable>
    <StructureEmptyState v-else />
  </div>
  <div v-else>
    <div>
      <SearchResult
        v-for="activity in filteredActivities"
        :key="activity.uid"
        :activity="activity"
        :is-selected="selectedActivity?.id === activity.id"
        @select="repositoryStore.selectActivity(activity.id)"
        @show="$emit('show', activity)"
      />
    </div>
    <TailorEmptyState
      v-if="!filteredActivities.length"
      action-text="Clear search"
      icon="mdi-magnify"
      prepend-action-icon="mdi-close"
      text="No activities match your search."
      title="No matches"
      @click:action="search = ''"
    />
  </div>
</template>

<script lang="ts" setup>
import Draggable from 'vuedraggable';
import { storeToRefs } from 'pinia';

import type { ChangeEvent, SortableEvent } from '@/types/draggable';
import type { StoreActivity } from '@/stores/activity';
import OutlineItem from '@/components/repository/Outline/OutlineItem.vue';
import SearchResult from '@/components/repository/Outline/SearchResult.vue';
import StructureEmptyState
  from '@/components/repository/Outline/StructureEmptyState/index.vue';
import { useCurrentRepository } from '@/stores/current-repository';
import { TailorEmptyState } from '@tailor-cms/core-components';

const search = defineModel<string>('search', { required: true });
defineEmits<{ show: [activity: StoreActivity] }>();

const repositoryStore = useCurrentRepository();
const { outlineActivities, rootActivities, selectedActivity } =
  storeToRefs(repositoryStore);

const reorder = useOutlineReorder();

const hasActivities = computed(() => !!rootActivities.value.length);

const filteredActivities = computed(() => {
  if (!search.value) return outlineActivities.value;
  const regex = new RegExp(search.value.trim(), 'i');
  return outlineActivities.value.filter(({ shortId, data: { name } }) => {
    return regex.test(shortId) || regex.test(name as string);
  });
});
</script>
