<template>
  <NuxtPage v-if="activityId" :key="activityId" :activityId="activityId" />
</template>

<script lang="ts" setup>
const route = useRoute();
const activityId = ref<number | null>(null);

const parseActivityId = () => {
  if (!route.params.activityId) navigateTo({ name: 'catalog' });
  activityId.value = parseInt(route.params.activityId as string, 10);
};

onBeforeMount(() => parseActivityId());
watch(() => route.params?.activityId, parseActivityId);
</script>
