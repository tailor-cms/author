<template>
  <VNavigationDrawer
    class="sidebar"
    color="primary-darken-2"
    elevation="5"
    width="440"
  >
    <div
      :class="{
        'toolbar-visible': selectedElement,
        'toolbar-composite': selectedElement?.parent,
      }"
      class="sidebar-container"
    >
      <VWindow v-model="selectedTab">
        <VWindowItem :value="BROWSER_TAB">
          <ActivityNavigation
            :repository="repository"
            :activities="activities"
            :selected="selectedActivity" />
        </VWindowItem>
        <VWindowItem :value="COMMENTS_TAB">
          TODO: Implement comments tab
          <!-- <ActivityDiscussion
            v-show="discussionTabVisible.value"
            :activity="props.selectedActivity" /> -->
        </VWindowItem>
        <VWindowItem :value="ELEMENT_TAB">
          <ElementSidebar
            v-if="selectedElement"
            :key="getElementId(selectedElement)"
            :element="selectedElement"
            :metadata="metadata"
          />
        </VWindowItem>
      </VWindow>
    </div>
    <template #append>
      <VTabs
        v-model="selectedTab"
        bg-color="primary-darken-4"
        color="secondary-lighten-4"
        fixed-tabs
        stacked
      >
        <VTab
          v-for="tab in tabs"
          :value="tab.name"
          :disabled="tab.disabled"
        >
          {{ tab.label }}
          <VIcon class="ma-1">mdi-{{ tab.icon }}</VIcon>
          <VBadge
            v-if="tab.badgeData"
            :content="tab.badgeData"
            color="secondary"
            offsetY="18"
            offsetX="-16"
          />
        </VTab>
      </VTabs>
    </template>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
// TODO: Need to migrate
// import ActivityDiscussion from '@/components/repository/common/ActivityDiscussion.vue';
import ActivityNavigation from './Navigation.vue';
import get from 'lodash/get';
import { getElementId } from '@tailor-cms/utils';

import type { Activity } from '@/api/interfaces/activity';
import type { ContentElement } from '@/api/interfaces/content-element';
import ElementSidebar from './ElementSidebar/index.vue';
import type { Repository } from '@/api/interfaces/repository';

const props = defineProps<{
  repository: Repository;
  activities: Activity[];
  selectedActivity: Activity;
  selectedElement: ContentElement | null;
}>();

const BROWSER_TAB = 'BROWSER_TAB';
const COMMENTS_TAB = 'COMMENTS_TAB';
const ELEMENT_TAB = 'ELEMENT_TAB';

const { $schemaService } = useNuxtApp() as any;

const selectedTab = ref(BROWSER_TAB);
const tabs = computed(() => [
  {
    name: BROWSER_TAB,
    label: 'Browse',
    icon: 'file-tree',
  },
  {
    name: COMMENTS_TAB,
    label: 'Comments',
    icon: 'forum-outline',
    // TODO: Need to implement
    // unseenCommentCount.value
    badgeData: null,
  },
  {
    name: ELEMENT_TAB,
    label: 'Element',
    icon: 'toy-brick-outline',
    disabled: !props.selectedElement?.type,
  },
]);

const elementSidebarEnabled = computed(
  () => props.selectedElement && !metadata.value.isEmpty,
);

const metadata = computed(() => {
  const schemaId = get(props.repository, 'schema');
  return $schemaService.getElementMetadata(schemaId, props.selectedElement);
});

watch(props.selectedElement, () => {
  if (elementSidebarEnabled.value) {
    selectedTab.value = ELEMENT_TAB;
    return;
  }
  if (selectedTab.value !== ELEMENT_TAB) return;
  selectedTab.value = BROWSER_TAB;
});

// TODO: Need to migrate
// watch(unseenComments, debounce((val) => {
//   unseenCommentCount.value = val.length;
// }, 200));
// const unseenComments = computed(() => store.getters['repository/comments/getUnseenActivityComments'](props.selectedActivity));
// const unseenCommentCount = ref(0);
// const discussionTabVisible = computed(() => selectedTab.value === 'comments');
</script>

<style lang="scss" scoped>
.sidebar {
  text-align: left;

  ::v-deep .v-navigation-drawer__content {
    -ms-overflow-style: none !important;  /* IE and Edge */
    scrollbar-width: none !important; /* Firefox */

    &::-webkit-scrollbar {
      display: none !important;
    }
  }
}

.sidebar-container {
  height: 100%;

  &.toolbar-visible {
    padding-top: 4.75rem;

    &.toolbar-composite {
      padding-top: 8.75rem;
    }
  }

  ::v-deep .activity-discussion {
    margin: 1rem 0;
    padding: 1rem;
    border: none;
  }
}
</style>
