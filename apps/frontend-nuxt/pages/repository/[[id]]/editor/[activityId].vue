<template>
  <div>
    <VToolbar
      v-if="editorStore.selectedActivity"
      :key="editorStore.selectedContentElementId as number"
      :element="editorStore.selectedContentElement as ContentElement"
      :active-users="activeUsers"
    />
    <div class="editor-content-container">
      <VSidebar
        :repository="repositoryStore.repository as Repository"
        :activities="repositoryStore.outlineActivities as Activity[]"
        :selected-activity="editorStore.selectedActivity as Activity"
        :selected-element="editorStore.selectedContentElement as ContentElement"
        class="sidebar"
      />
      <VActivityContent
        v-if="editorStore.selectedActivity"
        :key="editorStore.selectedActivity.id"
        :repository="repositoryStore.repository as Repository"
        :activity="editorStore.selectedActivity"
        :content-containers="editorStore.contentContainers"
        :root-container-groups="editorStore.rootContainerGroups"
        class="activity-content"
        @selected="selectElement"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getElementId } from '@tailor-cms/utils';

import type { Activity } from '@/api/interfaces/activity';
import type { ContentElement } from '@/api/interfaces/content-element';
import type { Repository } from '@/api/interfaces/repository';
import { useCurrentRepository } from '@/stores/current-repository';
import { useEditorStore } from '@/stores/editor';
import VActivityContent from '@/components/editor/ActivityContent/index.vue';
import VSidebar from '@/components/editor/Sidebar/index.vue';
import VToolbar from '@/components/editor/Toolbar/index.vue';

definePageMeta({
  name: 'editor',
  middleware: ['auth'],
});

const props = defineProps<{ activityId: number }>();

const repositoryStore = useCurrentRepository();
const editorStore = useEditorStore();

const selectElement = (element: any) => {
  const route = useRoute();
  const selectedElementId = getElementId(element);
  editorStore.selectedContentElementId = selectedElementId;
  editorStore.selectedContentElement = element;
  const { elementId: queryElementId, ...query } = route.query;
  if (editorStore.selectedContentElementId === queryElementId) return;
  // Can be deselected
  if (selectedElementId) query.elementId = selectedElementId;
  navigateTo({ query });
};

onBeforeMount(() => {
  editorStore.initialize(props.activityId);
});

// TODO: Needs to be implemented
const activeUsers: any = [];
// TODO: Publish diff, Toolbar and Sidebar need to be migrated
// import VSidebar from './VSidebar/index.vue';
// const showPublishDiff = computed(() => store.state.editor.showPublishDiff);
// const togglePublishDiff = () => store.commit('editor/togglePublishDiff');
// const closePublishDiff = () => {
//   togglePublishDiff(false);
// };
// onBeforeUnmount(() => {
//   closePublishDiff();
// });
// watch(
//   () => props.activityId,
//   () => {
//     selectedElement.value = null;
//     closePublishDiff();
//   },
// );
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
