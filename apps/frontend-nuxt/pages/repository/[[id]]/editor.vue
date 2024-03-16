<template>
  <NuxtPage v-if="activityId" :activityId="activityId" />
</template>

<script lang="ts" setup>
import { useEditorStore } from '@/stores/editor';

const editorStore = useEditorStore();
const activityId = ref<number | null>(null);

onBeforeMount(async () => {
  const route = useRoute();
  if (!route.params.activityId) navigateTo({ name: 'catalog' });
  activityId.value = parseInt(route.params.activityId as string, 10);
  editorStore.initialize(activityId.value);
});
</script>
