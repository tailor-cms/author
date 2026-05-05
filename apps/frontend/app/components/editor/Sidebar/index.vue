<template>
  <VNavigationDrawer
    v-model="modelValue"
    :width="lgAndUp ? 500 : 400"
    class="sidebar"
    color="primary-darken-2"
    elevation="5"
    location="right"
    mobile-breakpoint="md"
  >
    <VBtn
      v-tooltip:left="{ text: 'Close sidebar', openDelay: 500 }"
      class="sidebar-collapse-btn"
      color="primary-darken-3"
      icon="mdi-chevron-right"
      size="small"
      variant="flat"
      @click="modelValue = false"
    />
    <div class="sidebar-layout">
      <VTabs
        v-model="selectedTab"
        class="sidebar-tabs ma-3"
        color="secondary-lighten-4"
        density="compact"
        hide-slider
      >
        <VTab
          v-for="tab in tabs"
          :key="tab.name"
          :disabled="tab.disabled"
          :text="tab.label"
          :value="tab.name"
          :variant="selectedTab === tab.name ? 'tonal' : 'text'"
          class="mx-1"
          rounded="lg"
        >
          <template v-if="tab.badgeData" #append>
            <VBadge :content="tab.badgeData" color="secondary" inline />
          </template>
        </VTab>
      </VTabs>
      <VDivider />
      <div class="sidebar-content">
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
    bottom: 0.5rem;
    left: 0;
    z-index: 1;
    border-radius: 0 4px 4px 0 !important;
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

.sidebar-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-tabs {
  :deep(.v-tab) {
    min-width: unset;
    font-size: 0.875rem;
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
