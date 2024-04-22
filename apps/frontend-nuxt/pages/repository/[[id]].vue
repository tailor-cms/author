<template>
  <NuxtLayout name="main">
    <div v-if="isLoading" class="pt-16">
      <VProgressCircular
        bg-color="primary"
        color="primary-darken-4"
        size="68"
        indeterminate
      >
        <template #default>
          <img
            alt="Tailor logo"
            class="pt-1"
            height="52"
            src="/img/default-logo-full.svg"
            width="32"
          />
        </template>
      </VProgressCircular>
    </div>
    <NuxtPage v-else />
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { promiseTimeout } from '@vueuse/core';

import { useAuthStore } from '@/stores/auth';
import { useCommentStore } from '@/stores/comments';
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({
  middleware: ['auth'],
});

const { $eventBus } = useNuxtApp() as any;
// Expose $eventBus via Vue provide/inject to external components
provide('$eventBus', $eventBus);

const authStore = useAuthStore();
const currentRepositoryStore = useCurrentRepository();
const commentStore = useCommentStore();

const isLoading = ref(true);

onMounted(async () => {
  const route = useRoute();
  const repositoryId = parseInt(route.params.id as string, 10);
  await Promise.all([
    authStore.fetchUserInfo(),
    currentRepositoryStore.initialize(repositoryId),
    await promiseTimeout(1200),
  ]);
  commentStore.$reset();
  isLoading.value = false;
});

onUnmounted(() => {
  currentRepositoryStore.$reset();
  commentStore.$reset();
});
</script>
