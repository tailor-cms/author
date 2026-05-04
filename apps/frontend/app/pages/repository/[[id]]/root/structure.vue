<template>
  <VLayout class="structure-page">
    <VMain class="structure-container">
      <VContainer
        ref="structureEl"
        class="structure d-flex flex-column justify-start py-8 px-sm-15"
        max-width="1800"
      >
        <OutlineToolbar
          v-if="hasActivities || isCollection"
          v-model:search="filters.search"
          :has-activities="hasActivities"
        />
        <BrokenReferencesAlert />
        <div v-if="isCollection" class="collection-wrapper mt-5">
          <CollectionTable
            v-if="hasActivities"
            :activities="filteredActivities"
          />
          <VAlert
            v-else
            class="mb-5"
            color="primary-lighten-3"
            icon="mdi-information-outline"
            variant="tonal"
            prominent
          >
            Click on the button above in order to create your first item!
          </VAlert>
        </div>
        <template v-else>
          <template v-if="!filters.search">
            <Draggable
              v-bind="{ handle: '.activity' }"
              :list="rootActivities"
              :move="repositoryStore.isValidDrop"
              class="mt-5 d-flex flex-column ga-2"
              animation="150"
              group="activities"
              item-key="uid"
              @update="(e: SortableEvent) => reorder(e, rootActivities)"
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
            <OutlineFooter class="mt-1" />
          </template>
          <template v-else>
            <SearchResult
              v-for="activity in filteredActivities"
              :key="activity.uid"
              :activity="activity"
              :is-selected="
                repositoryStore.selectedActivity?.id === activity.id
              "
              @select="repositoryStore.selectActivity(activity.id)"
              @show="goTo(activity)"
            />
            <div class="my-6">
              <VAlert
                v-if="!filteredActivities.length"
                class="mb-5"
                color="primary-lighten-3"
                icon="mdi-magnify"
                variant="tonal"
                prominent
              >
                No matches found!
              </VAlert>
            </div>
          </template>
        </template>
      </VContainer>
    </VMain>
    <Sidebar />
  </VLayout>
</template>

<script lang="ts" setup>
import Draggable from 'vuedraggable';
import { storeToRefs } from 'pinia';

import type { ChangeEvent, SortableEvent } from '@/types/draggable';
import BrokenReferencesAlert from '@/components/common/BrokenReferencesAlert.vue';
import CollectionTable from '@/components/repository/Outline/CollectionTable.vue';
import OutlineFooter from '~/components/repository/Outline/OutlineFooter.vue';
import OutlineItem from '@/components/repository/Outline/OutlineItem.vue';
import OutlineToolbar from '@/components/repository/Outline/OutlineToolbar.vue';
import SearchResult from '@/components/repository/Outline/SearchResult.vue';
import Sidebar from '@/components/repository/Sidebar/index.vue';
import type { StoreActivity } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

interface Filters {
  search: string;
}

definePageMeta({
  name: 'repository',
  middleware: ['auth'],
});

const repositoryStore = useCurrentRepository();

const {
  outlineActivities,
  rootActivities,
  selectedActivity,
  isCollection,
} = storeToRefs(repositoryStore);

const reorder = useOutlineReorder();
const storageService = useStorageService();

provide('$storageService', storageService);

const filters = reactive<Filters>({
  search: '',
});

const structureEl = ref();
const hasActivities = computed(() => !!rootActivities.value.length);

const filteredActivities = computed(() => {
  return outlineActivities.value.filter(
    (activity: StoreActivity) =>
      !filters.search || filterBySearch(activity),
  );
});

const filterBySearch = ({ shortId, data }: StoreActivity) => {
  const regex = new RegExp(filters.search.trim(), 'i');
  return regex.test(shortId) || regex.test(data.name);
};

const goTo = async (activity: StoreActivity) => {
  filters.search = '';
  repositoryStore.selectActivity(activity.id);
  await nextTick();
  scrollToActivity(activity);
};

const scrollToActivity = (activity: StoreActivity, timeout = 500) => {
  repositoryStore.expandOutlineParents(activity.id);
  setTimeout(() => {
    const elementId = `#activity_${activity.uid}`;
    const container = structureEl.value?.$el ?? structureEl.value;
    const element = container?.querySelector?.(elementId);
    element?.scrollIntoView();
  }, timeout);
};

onMounted(() => {
  const route = useRoute();
  const { activityId } = route.query;
  if (activityId) {
    repositoryStore.selectActivity(parseInt(activityId as string, 10));
  } else if (rootActivities.value.length) {
    repositoryStore.selectActivity(rootActivities.value[0]!.id);
  } else {
    // If there are no activities
    return;
  }
  if (!selectedActivity.value) return;
  const isFirstActivitySelected =
    selectedActivity.value &&
    rootActivities.value[0]!.id === selectedActivity.value.id;
  if (!isFirstActivitySelected) {
    scrollToActivity(selectedActivity.value, 200);
  }
});
</script>

<style lang="scss" scoped>
:deep(.sortable-ghost) {
  opacity: 0.6;
}

.structure-page {
  height: 100%;
}

.structure-container {
  position: relative;
  height: 100%;
}

.structure {
  position: relative;
  height: 100%;
  overflow-y: scroll;
  overflow-y: overlay;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  > :deep(:last-child:not(.collection-wrapper)) {
    margin-bottom: 7.5rem;
  }
}

.collection-wrapper {
  flex: 0 1 auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
