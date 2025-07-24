<template>
  <VLayout class="structure-page">
    <VMain class="structure-container">
      <VContainer
        ref="structureEl"
        class="structure d-flex flex-column justify-start"
        max-width="1800"
      >
        <OutlineToolbar
          v-if="hasActivities || isGrid"
          v-model:activity-types="filters.activityTypes"
          v-model:search="filters.search"
          :activity-type-options="taxonomy"
          :has-activities="hasActivities"
        />
        <BrokenReferencesAlert />
        <VRow v-if="isGrid" class="mt-5 flex-grow-0" dense>
          <template v-if="filteredActivities.length">
            <VCol
              v-for="item in filteredActivities"
              :key="item.id"
              :cols="xlAndUp ? 3 : lgAndUp ? 4 : mdAndUp ? 6 : 12"
            >
              <OutlineCard :activity="item" />
            </VCol>
          </template>
          <VCol v-else cols="12">
            <VAlert
              :icon="`mdi-${hasActivities ? 'magnify' : 'information-outline'}`"
              class="mb-5"
              color="primary-lighten-3"
              variant="tonal"
              prominent
            >
              <template v-if="hasActivities">No matches found!</template>
              <template v-else>
                Click on the button above in order to create your first item!
              </template>
            </VAlert>
          </VCol>
        </VRow>
        <template v-else>
          <template v-if="!filters.search">
            <Draggable
              v-bind="{ handle: '.activity' }"
              :list="rootActivities"
              class="mt-5"
              item-key="uid"
              @update="(data) => reorder(data, rootActivities)"
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
import { OutlineStyle } from '@tailor-cms/interfaces/schema';
import { storeToRefs } from 'pinia';
import { useDisplay } from 'vuetify';

import BrokenReferencesAlert from '@/components/common/BrokenReferencesAlert.vue';
import OutlineCard from '@/components/repository/Outline/OutlineCard.vue';
import OutlineFooter from '~/components/repository/Outline/OutlineFooter.vue';
import OutlineItem from '@/components/repository/Outline/OutlineItem.vue';
import OutlineToolbar from '@/components/repository/Outline/OutlineToolbar.vue';
import SearchResult from '@/components/repository/Outline/SearchResult.vue';
import Sidebar from '@/components/repository/Sidebar/index.vue';
import type { StoreActivity } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

interface Filters {
  search: string;
  activityTypes: string[];
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
  taxonomy,
  schemaOutlineStyle,
} = storeToRefs(repositoryStore);

const reorder = useOutlineReorder();
const storageService = useStorageService();
const { mdAndUp, lgAndUp, xlAndUp } = useDisplay();

provide('$storageService', storageService);

const filters = reactive<Filters>({
  search: '',
  activityTypes: [],
});

const structureEl = ref();
const hasActivities = computed(() => !!rootActivities.value.length);

const isGrid = computed(() => schemaOutlineStyle.value === OutlineStyle.Grid);
const filteredActivities = computed(() => {
  const filterByType = (type: string) => filters.activityTypes.includes(type);
  return outlineActivities.value.filter(
    (activity: StoreActivity) =>
      (!filters.search || filterBySearch(activity)) &&
      (!filters.activityTypes.length || filterByType(activity.type)),
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
    const element = structureEl.value.querySelector(elementId);
    element.scrollIntoView();
  }, timeout);
};

onMounted(() => {
  const route = useRoute();
  const { activityId } = route.query;
  if (activityId) {
    repositoryStore.selectActivity(parseInt(activityId as string, 10));
  } else if (rootActivities.value.length) {
    repositoryStore.selectActivity(rootActivities.value[0].id);
  } else {
    // If there are no activities
    return;
  }
  const isFirstActivitySelected =
    selectedActivity.value &&
    rootActivities.value[0].id === selectedActivity.value.id;
  if (!isFirstActivitySelected) {
    scrollToActivity(selectedActivity.value as StoreActivity, 200);
  }
});
</script>

<style lang="scss" scoped>
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
  padding: 2rem 5.625rem 0 3.75rem;
  overflow-y: scroll;
  overflow-y: overlay;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  > :deep(:last-child) {
    margin-bottom: 7.5rem;
  }
}
</style>
