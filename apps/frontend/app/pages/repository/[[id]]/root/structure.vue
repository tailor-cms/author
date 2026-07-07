<template>
  <VLayout class="structure-page">
    <VMain scrollable>
      <VContainer
        ref="structureEl"
        class="structure d-flex flex-column justify-start px-md-10 py-md-8"
        max-width="1300"
      >
        <div v-if="hasToolbar" class="d-flex align-center ga-2 mb-4">
          <OutlineToolbar
            v-model:search="filters.search"
            :active-entity="selectedEntity"
            class="flex-grow-1"
          />
        </div>
        <BrokenReferencesAlert />
        <CollectionView
          v-if="isCollection"
          v-model:selected-entity="selectedEntity"
          :search="filters.search"
        />
        <OutlineView
          v-else
          :search="filters.search"
          class="mt-4"
          @show="goTo"
        />
      </VContainer>
    </VMain>
    <Sidebar />
  </VLayout>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import type { StoreActivity } from '@/stores/activity';
import BrokenReferencesAlert from '@/components/common/BrokenReferencesAlert.vue';
import CollectionView from '@/components/repository/Outline/CollectionView.vue';
import OutlineToolbar from '@/components/repository/Outline/OutlineToolbar.vue';
import OutlineView from '@/components/repository/Outline/OutlineView.vue';
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

const { rootActivities, selectedActivity, isCollection } =
  storeToRefs(repositoryStore);

const { selectedEntity } = useCollectionEntities();
const storageService = useStorageService();

provide('$storageService', storageService);

const filters = reactive<Filters>({ search: '' });
const structureEl = ref();

// Both the outline and collection empty states offer their own actions, so
// the toolbar would be redundant when there's nothing yet.
const hasToolbar = computed(
  () => !!rootActivities.value.length || !!filters.search,
);

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

const selectAndReveal = async (id: number, behavior?: ScrollBehavior) => {
  await repositoryStore.selectActivity(id);
  if (selectedActivity.value) scrollToActivity(selectedActivity.value, behavior);
};

watch(queryActivityId, (id) => {
  if (id == null || !selectedActivity.value) return;
  scrollToActivity(selectedActivity.value);
});

onMounted(() => {
  if (selectedActivity.value) scrollToActivity(selectedActivity.value, 'auto');
  else if (rootActivities.value.length) {
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

.structure {
  position: relative;

  > :deep(:last-child:not(.collection-wrapper)) {
    margin-bottom: 7.5rem;
  }
}
</style>
