<template>
  <div v-if="editorStore.selectedActivity" class="editor-root w-100">
    <VToolbar
      :key="`${editorStore.selectedActivityId}-${editorStore.selectedContentElementId}`"
      :active-users="activeUsers"
      :element="editorStore.selectedContentElement as ContentElement"
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
          color="secondary-container"
          aria-label="Open sidebar"
          density="comfortable"
          icon="mdi-file-tree"
          size="small"
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
        v-if="reviewStore.isLensAvailable"
        v-model="reviewStore.isPanelOpen"
      />
    </VMain>
    <VFadeTransition>
      <VBtn
        v-if="reviewStore.isLensAvailable && !reviewStore.isPanelOpen"
        v-tooltip:left="{ text: 'Open Lens review', openDelay: 500 }"
        class="lens-toggle"
        color="tertiary-container"
        aria-label="Open Lens review"
        density="comfortable"
        icon="mdi-camera-iris"
        size="small"
        @click="reviewStore.isPanelOpen = true"
      />
    </VFadeTransition>
  </div>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { Repository } from '@tailor-cms/interfaces/repository';

import { useCommentStore } from '@/stores/comments';
import { useConfigStore } from '@/stores/config';
import { useCurrentRepository } from '@/stores/current-repository';
import { useEditorStore } from '@/stores/editor';
import { useReviewStore } from '@/stores/review';
import FeedbackSidebar from '@/components/editor/FeedbackSidebar/index.vue';
import VSidebar from '@/components/editor/Sidebar/index.vue';
import VToolbar from '@/components/editor/Toolbar/index.vue';

const { $ceRegistry, $pluginRegistry } = useNuxtApp() as any;

const repositoryStore = useCurrentRepository();
const editorStore = useEditorStore();
const commentStore = useCommentStore();
const configStore = useConfigStore();
const reviewStore = useReviewStore();
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
// TODO: Needs to be implemented
const activeUsers: any = [];

const initializeFeedback = (activityId: number) => {
  if (!configStore.isAiAvailable) return;
  const repositoryId = parseInt(route.params.id as string, 10);
  if (repositoryId) reviewStore.initialize(repositoryId, activityId);
};

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
    initializeFeedback(activityId);
  },
);

onBeforeMount(() => {
  const activityId = parseActivityId();
  editorStore.initialize(activityId);
  initializeCommentStore(activityId);
  initializeFeedback(activityId);
});

onUnmounted(() => {
  editorStore.$reset();
  commentStore.$reset();
  reviewStore.$reset();
});
</script>

<style lang="scss" scoped>
.editor-root {
  position: relative;
  height: 100%;
}

.sidebar-toggle {
  position: absolute;
  width: 1.5rem;
  height: 3.5rem;
  top: 5.5rem;
  left: 0;
  border-radius: 0 12px 12px 0;
}

.lens-toggle {
  position: absolute;
  width: 1.5rem;
  height: 3.5rem;
  top: 5.5rem;
  right: 0;
  border-radius: 12px 0 0 12px;
}
</style>
