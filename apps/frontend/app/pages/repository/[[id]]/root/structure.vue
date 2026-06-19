<template>
  <VLayout class="structure-page">
    <VMain scrollable>
      <VContainer
        ref="structureEl"
        class="structure d-flex flex-column justify-start px-md-10 py-md-8"
        max-width="1200"
      >
        <div class="d-flex align-center ga-2 mb-6">
          <OutlineToolbar
            v-model:search="filters.search"
            v-model:sort="collectionSort"
            :active-entity="selectedEntity"
            class="flex-grow-1"
          />
          <VAppBarNavIcon
            v-if="smAndDown"
            aria-label="Toggle sidebar"
            density="comfortable"
            @click="repositoryStore.updateSidebar(!repositoryStore.isSidebarOpen)"
          />
        </div>
        <BrokenReferencesAlert />
        <div v-if="isCollection" class="collection-wrapper">
          <EntityFilter
            v-if="hasMultipleEntities"
            v-model="selectedEntity"
            :entities="entities"
            class="mb-4"
          />
          <CollectionList
            v-if="hasActivities"
            :activities="visibleCollectionItems"
            :sort="collectionSort"
          />
          <VEmptyState
            v-else
            class="py-16 rounded-lg"
            bg-color="surface-container"
            icon="mdi-view-list"
            title="No items yet."
            text="Click the Create button above to add your first item."
          />
        </div>
        <template v-else>
          <template v-if="!filters.search">
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
            <VEmptyState
              v-else
              class="py-16 rounded-lg"
              bg-color="surface-container"
              icon="mdi-file-tree"
              title="No items yet."
              text="Click the Create button above to add your first item."
            />
          </template>
          <template v-else>
            <div>
              <SearchResult
                v-for="activity in filteredActivities"
                :key="activity.uid"
                :activity="activity"
                :is-selected="repositoryStore.selectedActivity?.id === activity.id"
                @select="repositoryStore.selectActivity(activity.id)"
                @show="goTo(activity)"
              />
            </div>
            <VEmptyState
              v-if="!filteredActivities.length"
              class="py-16 rounded-lg"
              bg-color="surface-container"
              icon="mdi-magnify"
              title="No matches found."
              text="Try adjusting your search."
            />
          </template>
        </template>
      </VContainer>
    </VMain>
    <Sidebar />
  </VLayout>
</template>

<script lang="ts" setup>
import { filter } from 'lodash-es';
import Draggable from 'vuedraggable';
import { storeToRefs } from 'pinia';
import { useDisplay } from 'vuetify';

import type { ChangeEvent, SortableEvent } from '@/types/draggable';
import type { CollectionSort } from '@/composables/useCollectionEntities';
import type { StoreActivity } from '@/stores/activity';
import BrokenReferencesAlert from '@/components/common/BrokenReferencesAlert.vue';
import CollectionList from '@/components/repository/Outline/CollectionList.vue';
import EntityFilter from '@/components/repository/Outline/EntityFilter.vue';
import OutlineItem from '@/components/repository/Outline/OutlineItem.vue';
import OutlineToolbar from '@/components/repository/Outline/OutlineToolbar.vue';
import SearchResult from '@/components/repository/Outline/SearchResult.vue';
import Sidebar from '@/components/repository/Sidebar/index.vue';
import { useCurrentRepository } from '@/stores/current-repository';

interface Filters {
  search: string;
}

definePageMeta({
  name: 'repository',
  middleware: ['auth'],
});

const route = useRoute();
const repositoryStore = useCurrentRepository();
const { smAndDown } = useDisplay();

const {
  // hierarchy
  outlineActivities,
  rootActivities,
  // general
  selectedActivity,
  isCollection,
} = storeToRefs(repositoryStore);

// collection (inert unless the schema is a collection)
const { entities, selectedEntity, hasMultipleEntities } =
  useCollectionEntities();

const visibleCollectionItems = computed(() =>
  isCollection.value
    ? filteredActivities.value.filter((it) => it.type === selectedEntity.value)
    : [],
);

const reorder = useOutlineReorder();
const storageService = useStorageService();

provide('$storageService', storageService);

const filters = reactive<Filters>({
  search: '',
});

const collectionSort = ref<CollectionSort>({
  key: 'createdAt',
  order: 'desc',
});

const structureEl = ref();
const hasActivities = computed(() => !!rootActivities.value.length);

const filteredActivities = computed(() => {
  if (!filters.search) return outlineActivities.value;
  const regex = new RegExp(filters.search.trim(), 'i');
  return filter(outlineActivities.value, ({ shortId, data: { name } }) => {
    return regex.test(shortId) || regex.test(name as string);
  });
});

const queryActivityId = computed(() => {
  const { activityId } = route.query;
  if (!activityId) return null;
  const id = parseInt(activityId as string, 10);
  return Number.isNaN(id) ? null : id;
});

const goTo = async (activity: StoreActivity) => {
  filters.search = '';
  repositoryStore.selectActivity(activity.id);
  await nextTick();
  scrollToActivity(activity);
};

const isOffscreen = (el: HTMLElement) => {
  const { top, bottom } = el.getBoundingClientRect();
  return top < 0 || bottom > window.innerHeight;
};

const scrollToActivity = (
  activity: StoreActivity,
  behavior: ScrollBehavior = 'smooth',
) => {
  repositoryStore.expandOutlineParents(activity.id);
  const elementId = `#activity_${activity.uid}`;
  const container = structureEl.value?.$el ?? structureEl.value;
  const element = container?.querySelector?.(elementId) as HTMLElement | null;
  if (element && isOffscreen(element)) {
    element.scrollIntoView({ block: 'center', behavior });
  }
};

const selectAndReveal = (id: number, behavior?: ScrollBehavior) => {
  repositoryStore.selectActivity(id);
  if (selectedActivity.value) scrollToActivity(selectedActivity.value, behavior);
};

// React to `activityId` query changes within the same repository.
// The structure page is not remounted on same-route
// navigation, so the updated selection must be applied here.
watch(queryActivityId, (id) => {
  if (id == null || selectedActivity.value?.id === id) return;
  selectAndReveal(id);
});

onMounted(() => {
  if (queryActivityId.value != null) {
    selectAndReveal(queryActivityId.value, 'auto');
  } else if (rootActivities.value.length) {
    selectAndReveal(rootActivities.value[0]!.id, 'auto');
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

// No longer the scroll container (the scroller is) and not height-locked, so
// content grows naturally and the scroller scrolls.
.structure {
  position: relative;

  > :deep(:last-child:not(.collection-wrapper)) {
    margin-bottom: 7.5rem;
  }
}

.collection-wrapper {
  flex: 0 0 auto;
}
</style>
