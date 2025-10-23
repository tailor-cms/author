<template>
  <VNavigationDrawer
    :width="lgAndUp ? 480 : 380"
    class="sidebar"
    color="primary-darken-2"
    elevation="5"
    mobile-breakpoint="md"
  >
    <div class="sidebar-container">
      <VWindow v-model="selectedTab">
        <VWindowItem :value="BROWSER_TAB">
          <ActivityNavigation
            :activities="activities"
            :repository="repository"
            :selected="selectedActivity"
          />
        </VWindowItem>
        <VWindowItem :value="COMMENTS_TAB">
          <ActivityDiscussion :activity="selectedActivity" />
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
        height="76"
        fixed-tabs
        stacked
      >
        <VTab
          v-for="tab in tabs"
          :key="tab.name"
          :disabled="tab.disabled"
          :value="tab.name"
        >
          <VIcon class="ma-1">mdi-{{ tab.icon }}</VIcon>
          <VBadge
            v-if="tab.badgeData"
            :content="tab.badgeData"
            color="secondary"
            offset-x="-16"
            offset-y="18"
          />
          <span class="py-1">{{ tab.label }}</span>
        </VTab>
      </VTabs>
    </template>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import { get, reject } from 'lodash-es';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { getElementId } from '@tailor-cms/utils';
import type { Repository } from '@tailor-cms/interfaces/repository';
import { useDisplay } from 'vuetify';

import ActivityNavigation from './ActivityNavigation.vue';
import ElementSidebar from './ElementSidebar/index.vue';
import ActivityDiscussion from '@/components/repository/Discussion/index.vue';

const props = defineProps<{
  repository: Repository;
  activities: Activity[];
  selectedActivity: Activity;
  selectedElement: ContentElement | null;
}>();

const BROWSER_TAB = 'BROWSER_TAB';
const COMMENTS_TAB = 'COMMENTS_TAB';
const ELEMENT_TAB = 'ELEMENT_TAB';

const { $ceRegistry, $schemaService } = useNuxtApp() as any;
const { lgAndUp } = useDisplay();

const selectedTab = ref(BROWSER_TAB);
const tabs: any = computed(() => [
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
    disabled: !elementSidebarEnabled.value || !props.selectedElement?.type,
  },
]);

const elementSidebarEnabled = computed(() => {
  if (!props.selectedElement) return false;
  const { type, activityId } = props.selectedElement;
  const { inputs, relationships } = metadata.value;
  const visibleRelationships = reject(relationships, 'disableSidebarUi');
  const element = $ceRegistry.get(type);
  const hasRelationships = visibleRelationships.length && activityId;
  return inputs.length || hasRelationships || element?.hasSideToolbar;
});

const metadata = computed(() => {
  const schemaId = get(props.repository, 'schema');
  return $schemaService.getElementMetadata(schemaId, props.selectedElement);
});

watch(
  () => props.selectedElement,
  () => {
    if (elementSidebarEnabled.value) {
      selectedTab.value = ELEMENT_TAB;
      return;
    }
    if (selectedTab.value !== ELEMENT_TAB) return;
    selectedTab.value = BROWSER_TAB;
  },
);

// TODO: Need to migrate
// watch(unseenComments, debounce((val) => {
//   unseenCommentCount.value = val.length;
// }, 200));
// eslint-disable-next-line max-len
// const unseenComments = computed(() => store.getters['repository/comments/getUnseenActivityComments'](props.selectedActivity));
// const unseenCommentCount = ref(0);
// const discussionTabVisible = computed(() => selectedTab.value === 'comments');
</script>

<style lang="scss" scoped>
.sidebar {
  text-align: left;

  :deep(.v-navigation-drawer__content) {
    -ms-overflow-style: none !important;
    /* IE and Edge */
    scrollbar-width: none !important;
    /* Firefox */

    &::-webkit-scrollbar {
      display: none !important;
    }
  }

  .v-btn--disabled {
    opacity: 0.35;
  }
}

.sidebar-container {
  height: 100%;

  :deep(.activity-discussion) {
    margin: 1rem 0;
    padding: 1rem;
    border: none;
  }
}
</style>
