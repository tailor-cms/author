<template>
  <VLayout class="structure-page">
    <VMain class="structure-container">
      <div ref="structureEl" class="structure d-flex flex-column justify-start">
        <OutlineToolbar
          v-if="hasActivities"
          :is-flat="isFlat"
          :search="search"
          class="ml-1 flex-grow-0"
          @search="(val) => (search = val)"
        />
        <template v-if="!search">
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
            :is-selected="repositoryStore.selectedActivity?.id === activity.id"
            @select="repositoryStore.selectActivity(activity.id)"
            @show="goTo(activity)"
          />
          <div class="my-6">
            <VAlert
              v-if="!filteredActivities.length"
              class="mb-5"
              color="primary-lighten-2"
              icon="mdi-magnify"
              variant="tonal"
              prominent
            >
              No matches found!
            </VAlert>
          </div>
        </template>
      </div>
    </VMain>
    <Sidebar />
  </VLayout>
</template>

<script lang="ts" setup>
import Draggable from 'vuedraggable';
import filter from 'lodash/filter';
import find from 'lodash/find';
import map from 'lodash/map';
import { storeToRefs } from 'pinia';

import OutlineFooter from '@/components/repository/Outline/OutlineFooter.vue';
import OutlineItem from '@/components/repository/Outline/OutlineItem.vue';
import OutlineToolbar from '@/components/repository/Outline/OutlineToolbar.vue';
import SearchResult from '@/components/repository/Outline/SearchResult.vue';
import Sidebar from '@/components/repository/Sidebar/index.vue';
import type { StoreActivity } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({
  name: 'repository',
  middleware: ['auth'],
});

const repositoryStore = useCurrentRepository();

const { outlineActivities, rootActivities, selectedActivity, taxonomy } =
  storeToRefs(repositoryStore);

const reorder = useOutlineReorder();
const storageService = useStorageService();

provide('$storageService', storageService);

const search = ref('');
const structureEl = ref();
const hasActivities = computed(() => !!rootActivities.value.length);

const isFlat = computed(() => {
  const types = map(
    filter(taxonomy.value, (it) => !it.rootLevel),
    'type',
  );
  if (!types.length) return false;
  return !find(outlineActivities.value, (it) => types.includes(it.type));
});

const filteredActivities = computed(() => {
  if (!search.value) return outlineActivities.value;
  const regex = new RegExp(search.value.trim(), 'i');
  return filter(outlineActivities.value, ({ shortId, data: { name } }) => {
    return regex.test(shortId) || regex.test(name);
  });
});

const goTo = async (activity: StoreActivity) => {
  search.value = '';
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
