<template>
  <div v-if="editorStore.selectedActivity" class="w-100">
    <VToolbar
      :key="`${editorStore.selectedActivityId}-${editorStore.selectedContentElementId}`"
      :active-users="activeUsers"
      :element="editorStore.selectedContentElement as ContentElement"
      @toggle-feedback="feedbackStore.isPanelOpen = !feedbackStore.isPanelOpen"
    />
    <VSidebar
      v-model="showSidebar"
      :activities="repositoryStore.outlineActivities as Activity[]"
      :repository="repositoryStore.repository as Repository"
      :selected-activity="editorStore.selectedActivity as Activity"
      :selected-element="editorStore.selectedContentElement as ContentElement"
    />
    <VMain class="editor-main">
      <VFadeTransition>
        <VBtn
          v-if="!showSidebar"
          v-tooltip:right="{ text: 'Open sidebar', openDelay: 500 }"
          class="sidebar-toggle"
          aria-label="Open sidebar"
          density="comfortable"
          icon="mdi-chevron-double-right"
          size="small"
          variant="flat"
          @click="showSidebar = true"
        />
      </VFadeTransition>
      <NuxtPage
        v-if="activityId"
        :key="activityId"
        :activity-id="activityId"
        class="activity-content h-100"
      />
      <FeedbackSidebar
        v-if="isFeedbackEnabled"
        v-model="feedbackStore.isPanelOpen"
      />
    </VMain>
  </div>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { Repository } from '@tailor-cms/interfaces/repository';

import { useCommentStore } from '@/stores/comments';
import { useCurrentRepository } from '@/stores/current-repository';
import { useEditorStore } from '@/stores/editor';
import VSidebar from '@/components/editor/Sidebar/index.vue';
import VToolbar from '@/components/editor/Toolbar/index.vue';
import EngagementSidebar from '@/components/editor/EngagementSidebar/index.vue';

const { $ceRegistry, $pluginRegistry } = useNuxtApp() as any;

const repositoryStore = useCurrentRepository();
const editorStore = useEditorStore();
const commentStore = useCommentStore();
const route = useRoute();

useHead({
  title: repositoryStore.repository?.name,
  meta: [{ name: 'description', content: 'Tailor CMS - Editor page' }],
});

provide('$ceRegistry', $ceRegistry);
provide('$pluginRegistry', $pluginRegistry);
provide('$editorState', {
  isPublishDiff: computed(() => editorStore.showPublishDiff),
});

const activityId = ref<number | null>(null);
const showSidebar = ref(true);
const showGuidelines = ref(!!editorStore.guidelines);
// TODO: Needs to be implemented
const activeUsers: any = [];

const lastEditorActivity = useLastEditorActivity();

const parseActivityId = () => {
  if (!route.params.activityId) navigateTo({ name: 'catalog' });
  activityId.value = parseInt(route.params.activityId as string, 10);
  const repositoryId = parseInt(route.params.id as string, 10);
  if (repositoryId && activityId.value) {
    lastEditorActivity.set(repositoryId, activityId.value);
  }
  return activityId.value;
};

const initializeCommentStore = (activityId: number) => {
  return commentStore.fetch(editorStore.repositoryId as number, { activityId });
};

watch(
  () => route.params?.activityId,
  () => {
    const activityId = parseActivityId();
    initializeCommentStore(activityId);
  },
);

onBeforeMount(() => {
  const activityId = parseActivityId();
  editorStore.initialize(activityId);
  initializeCommentStore(activityId);
});

onUnmounted(() => {
  editorStore.$reset();
  commentStore.$reset();
});
</script>

<style lang="scss" scoped>
.sidebar-toggle {
  position: fixed;
  width: 1.75rem;
  height: 3.5rem;
  top: 50%;
  left: 4.75rem;
  transform: translateY(-50%);
  z-index: 1004;
  opacity: 0.85;
  border-radius: 0 8px 8px 0;
  box-shadow: 0.125rem 0 0.5rem rgba(0, 0, 0, 0.25);
  transition: opacity 160ms ease, transform 160ms ease;

  &:hover {
    opacity: 1;
    transform: translateY(-50%) translateX(2px);
  }
}
</style>
