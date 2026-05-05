<template>
  <VLayout v-if="editorStore.selectedActivity" class="h-100">
    <VToolbar
      :key="`${editorStore.selectedActivityId}-${editorStore.selectedContentElementId}`"
      :active-users="activeUsers"
      :element="editorStore.selectedContentElement as ContentElement"
      @toggle-guidelines="showGuidelines = !showGuidelines"
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
          color="primary-darken-2"
          icon="mdi-chevron-right"
          variant="flat"
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
      <EngagementSidebar
        v-if="!!editorStore.guidelines"
        v-model="showGuidelines"
      />
    </VMain>
  </VLayout>
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
const showGuidelines = ref(null);
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
  bottom: 0.5rem;
  left: 92px;
  z-index: 1004;
  border-radius: 0 4px 4px 0 !important;
  width: 2rem !important;
  height: 3rem !important;

  &:hover {
    opacity: 1;
  }
}
</style>
