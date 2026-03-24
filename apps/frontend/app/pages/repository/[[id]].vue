<template>
  <NuxtLayout name="main">
    <div v-if="isLoading" class="pt-16">
      <CircularProgress />
    </div>
    <NuxtPage v-else />
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { CircularProgress } from '@tailor-cms/core-components';
import { promiseTimeout } from '@vueuse/core';

import { useAuthStore } from '@/stores/auth';
import { useCommentStore } from '@/stores/comments';
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({
  middleware: ['auth'],
});

const { $eventBus } = useNuxtApp() as any;

const route = useRoute();
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

// Teardown active connections and reset stores (for the current repository).
const teardown = () => {
  repositorySSE.disconnect();
  currentRepositoryStore.$reset();
  commentStore.$reset();
};

// Initialize repository context: fetch data, connect SSE, reset stores.
// The nextTick ensures Vue flushes the DOM so children unmount before
// stores are reset — preventing stale access in child lifecycle hooks.
const initialize = async (repositoryId: number) => {
  isLoading.value = true;
  await nextTick();
  teardown();
  await Promise.all([
    authStore.fetchUserInfo(),
    currentRepositoryStore.initialize(repositoryId),
    promiseTimeout(1200),
  ]);
  isLoading.value = false;
  repositorySSE.connect(repositoryId);
};

const repositoryId = computed(() => parseInt(route.params.id as string, 10));

onMounted(() => initialize(repositoryId.value));
watch(repositoryId, (newId, oldId) => {
  if (newId && newId !== oldId) initialize(newId);
});

onUnmounted(teardown);
</script>
