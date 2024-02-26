<template>
  <div>
    <!-- TODO: Toolbar needs to be migrated -->
    <!-- <VToolbar :element="selectedElement.value" :active-users="activeUsers" /> -->
    <div class="editor-content-container">
      <!-- TODO: Sidebar needs to be migrated -->
      <!-- <VSidebar
        :repository="repository.value"
        :activities="outlineActivities.value"
        :selected-activity="activity.value"
        :selected-element="selectedElement.value"
        class="sidebar"
      /> -->
      <VActivityContent
        v-if="editorStore.selectedActivity"
        :key="editorStore.selectedActivity.id"
        :activity="editorStore.selectedActivity"
        :content-containers="editorStore.contentContainers"
        :repository="repositoryStore.repository as Repository"
        :root-container-groups="editorStore.rootContainerGroups"
        class="activity-content"
        @selected="selectElement"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getElementId } from '@tailor-cms/utils';

import type { Repository } from '@/api/interfaces/repository';
import { useCurrentRepository } from '@/stores/current-repository';
import { useEditorStore } from '@/stores/editor';
import VActivityContent from '@/components/editor/ActivityContent/index.vue';

// TODO: Publish diff, Toolbar and Sidebar need to be migrated
// import VSidebar from './VSidebar/index.vue';
// import VToolbar from './VToolbar/index.vue';
// const showPublishDiff = computed(() => store.state.editor.showPublishDiff);
// const togglePublishDiff = () => store.commit('editor/togglePublishDiff');
// const closePublishDiff = () => {
//   togglePublishDiff(false);
// };
// onBeforeUnmount(() => {
//   closePublishDiff();
// });
//
// watch(
//   () => props.activityId,
//   () => {
//     selectedElement.value = null;
//     closePublishDiff();
//   },
// );

const editorStore = useEditorStore();
const repositoryStore = useCurrentRepository();

definePageMeta({
  name: 'editor',
  middleware: ['auth'],
});

const selectElement = (element: any) => {
  const route = useRoute();
  const selectedElementId = getElementId(element);
  editorStore.selectedContentElementId = selectedElementId;
  editorStore.selectedContentElement = element;
  const { elementId: queryElementId, ...query } = route.query;
  if (editorStore.selectedContentElementId === queryElementId) return;
  if (selectedElementId) query.elementId = selectedElementId;
  navigateTo({ query });
};

onMounted(() => {
  const route = useRoute();
  const { activityId } = route.params;
  editorStore.initialize(parseInt(activityId as string, 10));
});
</script>

<style lang="scss" scoped>
$sidebar-width: 25rem;

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
