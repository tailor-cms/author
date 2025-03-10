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
import { activity as activityUtils, getElementId } from '@tailor-cms/utils';
import { schema } from '@tailor-cms/config';

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

const { $eventBus } = useNuxtApp() as any;

const props = defineProps<{ activityId: number }>();

const router = useRouter();

const authStore = useAuthStore();
const repositoryStore = useCurrentRepository();
const editorStore = useEditorStore();

provide('$getCurrentUser', () => authStore.user);
provide('$api', exposedApi);
provide('$schemaService', schema);

const appChannel = $eventBus.channel('app');

await editorStore.initialize(props.activityId);

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
    params: { id: repositoryId, activityId },
    query: { elementId },
  });
  navigateTo(route.href, { open: { target: '_blank' } });
});

const closePublishDiff = () => editorStore.togglePublishDiff(false);

const preventAccessIfDeleted = () => {
  const predecessors = activityUtils.getAncestors(
    repositoryStore.activities,
    editorStore.selectedActivity,
  );
  const isSoftDeleted = [...predecessors, editorStore.selectedActivity].some(
    (activity) => activity.deletedAt,
  );
  if (isSoftDeleted) router.replace('/');
};

onMounted(() => preventAccessIfDeleted());
onBeforeUnmount(() => closePublishDiff());

watch(
  () => props.activityId,
  () => {
    preventAccessIfDeleted();
    closePublishDiff();
  },
);
</script>
