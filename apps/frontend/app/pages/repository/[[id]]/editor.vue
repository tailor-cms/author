<template>
  <div v-if="editorStore.selectedActivity">
    <VToolbar
      :key="`${editorStore.selectedActivityId}-${editorStore.selectedContentElementId}`"
      :active-users="activeUsers"
      :element="editorStore.selectedContentElement as ContentElement"
    />
    <div class="editor-content-container">
      <VSidebar
        :activities="repositoryStore.outlineActivities as Activity[]"
        :repository="repositoryStore.repository as Repository"
        :selected-activity="editorStore.selectedActivity as Activity"
        :selected-element="editorStore.selectedContentElement as ContentElement"
        class="sidebar"
      />
      <NuxtPage
        v-if="activityId"
        :key="activityId"
        :activity-id="activityId"
        class="activity-content"
      />
      <EngagementSidebar v-if="!!editorStore.guidelines" />
    </div>
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

const { $ceRegistry } = useNuxtApp() as any;

const repositoryStore = useCurrentRepository();
const editorStore = useEditorStore();
const commentStore = useCommentStore();
const route = useRoute();

useHead({
  title: repositoryStore.repository?.name,
  meta: [{ name: 'description', content: 'Tailor CMS - Editor page' }],
});

provide('$ceRegistry', $ceRegistry);
provide('$editorState', {
  isPublishDiff: computed(() => editorStore.showPublishDiff),
});

const activityId = ref<number | null>(null);
// TODO: Needs to be implemented
const activeUsers: any = [];

const parseActivityId = () => {
  if (!route.params.activityId) navigateTo({ name: 'catalog' });
  activityId.value = parseInt(route.params.activityId as string, 10);
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
$sidebar-width: 30rem;

.editor-content-container {
  display: flex;
  height: calc(100% - 3.5rem);

  .sidebar {
    flex-basis: $sidebar-width;
  }

  .activity-content {
    flex-grow: 1;
    flex-basis: calc(100% - #{$sidebar-width});
  }
}
</style>
