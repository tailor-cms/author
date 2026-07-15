<template>
  <NuxtLayout name="main">
    <div v-if="isLoading" class="pt-16">
      <CircularProgress />
    </div>
    <template v-else>
      <NavigationRail @action="onRailAction" />
      <VLayout
        class="h-100 mr-3 bg-surface-canvas rounded-t-xl border-sm">
        <NuxtPage />
      </VLayout>
      <AgentPanel />
      <CloneModal v-if="showCloneModal" @close="showCloneModal = false" />
      <ExportDialog
        v-if="showExportModal"
        :repository="currentRepositoryStore.repository as Repository"
        @close="showExportModal = false"
      />
      <ProgressDialog
        :show="publishUtils.isPublishing.value"
        :status="publishPercentage"
      />
    </template>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { CircularProgress } from '@tailor-cms/core-components';
import { promiseTimeout } from '@vueuse/core';
import type { Repository } from '@tailor-cms/interfaces/repository';

import CloneModal from '@/components/repository/Settings/CloneModal.vue';
import ExportDialog from '@/components/repository/Settings/ExportModal.vue';
import NavigationRail from '@/components/repository/NavigationRail/index.vue';
import AgentPanel from '@/components/common/AgentPanel/index.vue';
import ProgressDialog from '@/components/common/ProgressDialog.vue';
import { useAuthStore } from '@/stores/auth';
import { useCommentStore } from '@/stores/comments';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';
import { usePublishActivity } from '@/composables/usePublishActivity';
import { useRepositoryStore } from '@/stores/repository';

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

const repositoryStore = useRepositoryStore();
const publishUtils = usePublishActivity();
const confirmationDialog = useConfirmationDialog();
const notify = useNotification();

const showCloneModal = ref(false);
const showExportModal = ref(false);
const publishPercentage = computed(
  () => publishUtils.status.value.progress * 100,
);

const showDeleteConfirmation = () => {
  const { id, name } = currentRepositoryStore.repository as Repository;
  const type = currentRepositoryStore.schemaName;
  confirmationDialog({
    title: `Delete ${type}?`,
    color: 'error',
    message: `Are you sure you want to delete the ${type} "${name}"?`,
    action: async () => {
      try {
        await repositoryStore.remove(id);
        notify(`The ${type} has been deleted`, { immediate: true });
        navigateTo('/');
      } catch {
        notify(`We couldn't delete the ${type}`, { color: 'error' });
      }
    },
  });
};

const onRailAction = (name: 'clone' | 'publish' | 'export' | 'delete') => {
  if (name === 'clone') showCloneModal.value = true;
  else if (name === 'export') showExportModal.value = true;
  else if (name === 'publish') {
    publishUtils.publishRepository(currentRepositoryStore.outlineActivities);
  } else if (name === 'delete') showDeleteConfirmation();
};

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
  try {
    await Promise.all([
      authStore.fetchUserInfo(),
      currentRepositoryStore.initialize(repositoryId),
      promiseTimeout(1200),
    ]);
  } catch (error) {
    // 403 (not a member) or 404 (deleted); bounce to the catalog with
    // a notice instead of leaving the loading screen up.
    const status = (error as any)?.response?.status;
    const message =
      status === 403
        ? 'You do not have access to this repository.'
        : 'We could not load this repository.';
    notify(message, { color: 'error', immediate: true });
    return navigateTo({ name: 'catalog' });
  }
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
