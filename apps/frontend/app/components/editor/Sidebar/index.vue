<template>
  <VNavigationDrawer
    v-model="modelValue"
    :class="{ resizing: isResizing }"
    :width="width"
    class="editor-sidebar-main sidebar"
    color="surface-container-low"
    elevation="0"
    location="left"
    mobile-breakpoint="md"
  >
    <div
      aria-orientation="vertical"
      class="resize-handle"
      role="separator"
      @pointerdown="startResize"
    />
    <div class="sidebar-layout">
      <div ref="tabRowEl" class="sidebar-tab-row d-flex align-center mt-1">
        <VTabs
          v-model="selectedTab"
          show-arrows="never"
          class="sidebar-tabs flex-grow-1"
          color="primary"
          density="compact"
          hide-slider
        >
          <VTab
            v-for="tab in tabs"
            :key="tab.name"
            v-tooltip:bottom="
              compact ? { text: tab.label, openDelay: 500 } : undefined
            "
            :aria-label="tab.label"
            :disabled="tab.disabled"
            :value="tab.name"
            :variant="selectedTab === tab.name ? 'tonal' : 'text'"
            class="mr-1"
            rounded="pill"
          >
            <VIcon v-if="compact" :icon="`mdi-${tab.icon}`" />
            <template v-else>{{ tab.label }}</template>
            <template v-if="tab.badgeData" #append>
              <VBadge :content="tab.badgeData" color="tertiary" inline />
            </template>
          </VTab>
        </VTabs>
        <VBtn
          v-tooltip:bottom="{ text: 'Collapse sidebar', openDelay: 500 }"
          aria-label="Collapse sidebar"
          class="sidebar-collapse-btn"
          icon="mdi-chevron-double-left"
          size="small"
          density="comfortable"
          variant="tonal"
          @click="modelValue = false"
        />
      </div>
      <VDivider class="sidebar-divider" />
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
          <VWindowItem :value="HISTORY_TAB">
            <ActivityHistory :activity="selectedActivity" />
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
  <VFadeTransition>
    <VBtn
      v-if="!modelValue"
      v-tooltip:right="{ text: 'Open sidebar', openDelay: 500 }"
      :icon="activeTabIcon"
      aria-label="Open sidebar"
      class="sidebar-toggle"
      color="secondary-container"
      density="comfortable"
      size="small"
      @click="modelValue = true"
    />
  </VFadeTransition>
</template>

<script lang="ts" setup>
import { useElementSize } from '@vueuse/core';
import { get, reject } from 'lodash-es';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { getElementId } from '@tailor-cms/utils';
import type { Repository } from '@tailor-cms/interfaces/repository';
import { useDisplay } from 'vuetify';

import ActivityNavigation from './ActivityNavigation.vue';
import ElementSidebar from './ElementSidebar/index.vue';
import ActivityDiscussion from '@/components/repository/Discussion/index.vue';
import ActivityHistory from '@/components/repository/Revisions/ActivityHistory.vue';
import { useCurrentRepository } from '@/stores/current-repository';

const modelValue = defineModel<boolean>({ required: true });

const props = defineProps<{
  repository: Repository;
  activities: Activity[];
  selectedActivity: Activity;
  selectedElement: ContentElement | null;
}>();

const BROWSER_TAB = 'BROWSER_TAB';
const COMMENTS_TAB = 'COMMENTS_TAB';
const HISTORY_TAB = 'HISTORY_TAB';
const ELEMENT_TAB = 'ELEMENT_TAB';

const { $ceRegistry, $schemaService } = useNuxtApp() as any;
const { lgAndUp } = useDisplay();
const { isCollection } = storeToRefs(useCurrentRepository());

const { width, isResizing, startResize } = useDrawerResize({
  side: 'left',
  storageKey: 'editor:sidebar:width',
  defaultWidth: () => (lgAndUp.value ? 480 : 380),
});

const defaultTab = isCollection.value ? COMMENTS_TAB : BROWSER_TAB;
const selectedTab = ref(defaultTab);

const tabRowEl = ref<HTMLElement | null>(null);
const { width: tabRowWidth } = useElementSize(tabRowEl);
// Collapse the tabs to icon-only when the row gets tight, so the labels
// never wrap or overflow as the sidebar is narrowed.
const compact = computed(
  () => tabRowWidth.value > 0 && tabRowWidth.value < 340,
);

const tabs: any = computed(() => [
  ...(!isCollection.value
    ? [{ name: BROWSER_TAB, label: 'Browse', icon: 'file-tree' }]
    : []),
  {
    name: COMMENTS_TAB,
    label: 'Comments',
    icon: 'forum-outline',
    // TODO: Need to implement
    // unseenCommentCount.value
    badgeData: null,
  },
  {
    name: HISTORY_TAB,
    label: 'History',
    icon: 'history',
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

const activeTabIcon = computed(() => {
  const active = tabs.value.find((tab: any) => tab.name === selectedTab.value);
  return active ? `mdi-${active.icon}` : 'mdi-dock-left';
});

watch(
  () => props.selectedElement,
  () => {
    if (elementSidebarEnabled.value) {
      selectedTab.value = ELEMENT_TAB;
      return;
    }
    if (selectedTab.value !== ELEMENT_TAB) return;
    selectedTab.value = defaultTab;
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

  // Suppress the drawer's width animation while dragging
  &.resizing {
    transition-duration: 0s !important;
  }

  .v-btn--disabled {
    opacity: 0.35;
  }
}

.sidebar-toggle {
  position: absolute;
  width: 1.5rem;
  height: 3.5rem;
  top: 5.5rem;
  left: 0;
  border-radius: 0 12px 12px 0;
}

.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 0.3125rem;
  z-index: 100;
  cursor: col-resize;
  touch-action: none;

  &:hover,
  &:active {
    background: rgba(var(--v-theme-primary), 0.25);
  }
}

.sidebar-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-tab-row {
  padding: 0.5rem 0.5rem 0.5rem 0.75rem;
  gap: 0.25rem;
}

.sidebar-tabs {
  min-width: 0;

  :deep(.v-tab) {
    min-width: unset;
    font-size: 0.8125rem;
    letter-spacing: 0.01em;
    text-transform: none;
  }
}

.sidebar-collapse-btn {
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 160ms ease;

  &:hover {
    opacity: 1;
  }
}

.sidebar-divider {
  border-color: rgba(var(--v-theme-on-surface), 0.08);
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

  :deep(.v-window-item) {
    padding-bottom: 4rem;
  }

  :deep(.activity-discussion) {
    padding: 1rem;
    border: none;
  }
}
</style>
