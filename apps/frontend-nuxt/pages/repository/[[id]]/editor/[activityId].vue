<template>
  <div class="d-flex flex-column w-100">
    <ActivityContent
      v-if="editorStore.selectedActivity?.id"
      :key="editorStore.selectedActivity.id"
      :activity="editorStore.selectedActivity"
      :content-containers="editorStore.contentContainers"
      :repository="repositoryStore.repository"
      :root-container-groups="editorStore.rootContainerGroups"
      @selected="selectElement"
    />
  </div>
</template>

<script lang="ts" setup>
import { getElementId } from '@tailor-cms/utils';

import ActivityContent from '@/components/editor/ActivityContent/index.vue';
import { useAuthStore } from '@/stores/auth';
import { useCurrentRepository } from '@/stores/current-repository';
import { useEditorStore } from '@/stores/editor';

definePageMeta({
  name: 'editor',
  middleware: ['auth'],
});

const props = defineProps<{ activityId: number }>();

const authStore = useAuthStore();
const repositoryStore = useCurrentRepository();
const editorStore = useEditorStore();

provide('$getCurrentUser', () => authStore.user);

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
