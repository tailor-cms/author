<template>
  <NuxtLayout name="main">
    <div v-if="isLoading" class="pt-16">
      <CircularProgress />
    </div>
    <NuxtPage v-else />
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { CircularProgress } from '@tailor-cms/core-components-next';
import { promiseTimeout } from '@vueuse/core';

import { useAuthStore } from '@/stores/auth';
import { useCommentStore } from '@/stores/comments';
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({
  middleware: ['auth'],
});

const { $eventBus } = useNuxtApp() as any;
const authStore = useAuthStore();
const currentRepositoryStore = useCurrentRepository();
const commentStore = useCommentStore();
const repositorySSE = useRepositorySSE();

// Expose $eventBus via Vue provide/inject to external components
provide('$eventBus', $eventBus);
provide(
  '$repository',
  computed(() => {
    const { repository, activities } = currentRepositoryStore;
    return { ...repository, activities };
  }),
);

const isLoading = ref(true);

onMounted(async () => {
  const route = useRoute();
  const repositoryId = parseInt(route.params.id as string, 10);
  await Promise.all([
    authStore.fetchUserInfo(),
    currentRepositoryStore.initialize(repositoryId),
    promiseTimeout(1200),
  ]);
  commentStore.$reset();
  isLoading.value = false;
  repositorySSE.connect(repositoryId);
});

onUnmounted(() => {
  currentRepositoryStore.$reset();
  commentStore.$reset();
  repositorySSE.disconnect();
});
</script>
