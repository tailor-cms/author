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
import { schema } from 'tailor-config-shared';

import ActivityContent from '@/components/editor/ActivityContent/index.vue';
import { exposedApi } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useCurrentRepository } from '@/stores/current-repository';
import { useEditorStore } from '@/stores/editor';

interface ElementRouteProps {
  repositoryId: number;
  activityId: number;
  elementId: string;
}

definePageMeta({
  name: 'editor',
  middleware: ['auth'],
});

const props = defineProps<{ activityId: number }>();

const authStore = useAuthStore();
const repositoryStore = useCurrentRepository();
const editorStore = useEditorStore();

const { $ceRegistry, $eventBus } = useNuxtApp() as any;

provide('$ceRegistry', $ceRegistry);
provide('$getCurrentUser', () => authStore.user);
provide('$api', exposedApi);
provide('$schemaService', schema);

const appChannel = $eventBus.channel('app');

await editorStore.initialize(props.activityId);
provide('$editorState', {
  isPublishDiff: computed(() => editorStore.showPublishDiff),
});
provide('$repository', {
  ...repositoryStore.repository,
  activities: repositoryStore.activities,
});

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

appChannel.on('openElement', (props: ElementRouteProps) => {
  const { repositoryId, activityId, elementId } = props;
  const route = useRouter().resolve({
    params: { activityId, repositoryId },
    query: { elementId },
  });
  navigateTo(route.href, { open: { target: '_blank' } });
});

const closePublishDiff = () => editorStore.togglePublishDiff(false);

onBeforeUnmount(() => closePublishDiff());

watch(
  () => props.activityId,
  () => closePublishDiff(),
);
</script>
