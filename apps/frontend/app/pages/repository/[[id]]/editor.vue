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
      <NuxtPage v-if="activityId" :key="activityId" :activity-id="activityId" />
    </VMain>
    <FeedbackSidebar
      v-if="reviewStore.isLensAvailable"
      v-model="reviewStore.isPanelOpen"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { Repository } from '@tailor-cms/interfaces/repository';
import { useDisplay } from 'vuetify';

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
  showDiff: computed(() => editorStore.isPreviewMode),
});

const activityId = ref<number | null>(null);
// Open by default only when the sidebar is permanent (mirrors the drawer's
// `mobile-breakpoint="md"`); on mobile it stays closed so it never overlays
// the opened element. Runtime breakpoint crossings are handled by Vuetify.
const { mdAndUp } = useDisplay();
const showSidebar = ref(mdAndUp.value);
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
</style>
