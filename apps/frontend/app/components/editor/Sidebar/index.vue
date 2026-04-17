<template>
  <VNavigationDrawer
    v-model="modelValue"
    :width="isContentCollapsed ? 92 : (lgAndUp ? 500 : 400)"
    class="sidebar"
    color="primary-darken-2"
    elevation="5"
    mobile-breakpoint="md"
  >
    <VBtn
      v-tooltip:right="{ text: 'Close sidebar', openDelay: 500 }"
      class="sidebar-collapse-btn"
      color="primary-darken-3"
      icon="mdi-chevron-left"
      size="small"
      variant="flat"
      @click="modelValue = false"
    />
    <div class="sidebar-layout">
      <VSheet
        class="sidebar-rail-column text-center"
        :color="isContentCollapsed ? 'primary-darken-2' : 'primary-darken-3'"
      >
        <VBtn
          v-tooltip:right="{
            text: isContentCollapsed ? 'Expand panel' : 'Collapse panel',
            openDelay: 500,
          }"
          class="mt-4 mb-2"
          icon="mdi-menu"
          variant="text"
          color="white"
          @click="toggleContent"
        />
        <VTabs
          v-model="selectedTab"
          class="sidebar-rail pa-2"
          color="secondary-lighten-4"
          direction="vertical"
          hide-slider
          height="68"
          stacked
          @update:model-value="onTabSelect"
        >
          <VTab
            v-for="tab in tabs"
            :key="tab.name"
            :disabled="tab.disabled"
            :prepend-icon="`mdi-${tab.icon}`"
            :text="tab.label"
            :value="tab.name"
            :variant="selectedTab === tab.name ? 'tonal' : 'text'"
            class="pa-2 mb-1"
            rounded="lg"
          >
            <template v-if="tab.badgeData" #append>
              <VBadge :content="tab.badgeData" color="secondary" inline />
            </template>
          </VTab>
        </VTabs>
      </VSheet>
      <div v-if="!isContentCollapsed" class="sidebar-content">
        <VWindow v-model="selectedTab" class="h-100">
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
    </div>
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

const modelValue = defineModel<boolean>({ required: true });

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
const isContentCollapsed = ref(false);

const toggleContent = () => {
  isContentCollapsed.value = !isContentCollapsed.value;
};

const onTabSelect = () => {
  if (isContentCollapsed.value) isContentCollapsed.value = false;
};

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

  .sidebar-collapse-btn {
    position: absolute;
    bottom: 5.5rem;
    right: 0;
    z-index: 1;
    border-radius: 4px 0 0 4px !important;
    width: 2rem !important;
    height: 3rem !important;

    &:hover {
      opacity: 1;
    }
  }

  :deep(.v-navigation-drawer__content) {
    overflow: hidden !important;
  }

  .v-btn--disabled {
    opacity: 0.35;
  }
}

.sidebar-rail-column {
  transition: background-color 0.3s ease;
}

.sidebar-layout {
  display: flex;
  height: 100%;
}

.sidebar-rail {
  :deep(.v-tab) {
    min-width: unset;
    justify-content: center;
    font-size: 0.75rem;
    letter-spacing: normal;
    text-transform: none;
  }
}

.sidebar-content {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow-y: auto;

  :deep(.v-window),
  :deep(.v-window__container) {
    height: 100%;
    overflow: visible;
  }

  :deep(.activity-discussion) {
    margin: 1rem 0;
    padding: 1rem;
    border: none;
  }
}
</style>
