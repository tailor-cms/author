<template>
  <VContainer class="h-100 pt-10">
    <VRow>
      <VCol cols="3">
        <Sidebar @action="onActionClick" />
      </VCol>
      <VCol class="pl-8" cols="9">
        <VSheet color="transparent" rounded="lg">
          <NuxtPage />
        </VSheet>
      </VCol>
    </VRow>
    <CloneModal v-if="showCloneModal" @close="showCloneModal = false" />
    <ExportDialog v-if="showExportModal" @close="showExportModal = false" />
    <ProgressDialog :show="isPublishing" :status="publishPercentage" />
  </VContainer>
  <AppFooter />
</template>

<script lang="ts" setup>
import AppFooter from '@/components/common/AppFooter.vue';
import CloneModal from '@/components/repository/Settings/CloneModal.vue';
import ExportDialog from '@/components/repository/Settings/ExportModal.vue';
import ProgressDialog from '@/components/common/ProgressDialog.vue';
import Sidebar from '@/components/repository/Settings/Sidebar.vue';

import type { Repository } from '~/api/interfaces/repository';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';
import { usePublishActivity } from '@/composables/usePublishActivity';
import { useRepositoryStore } from '@/stores/repository';

definePageMeta({
  name: 'repository-settings',
});

const repositoryStore = useRepositoryStore();
const currentRepositoryStore = useCurrentRepository();
const publishUtils = usePublishActivity();
const confirmationDialog = useConfirmationDialog();

const isPublishing = ref(false);
const showCloneModal = ref(false);
const showExportModal = ref(false);
const publishPercentage = computed(
  () => publishUtils.status.value.progress * 100,
);

const clone = () => {
  showCloneModal.value = true;
};

const publishRepository = () => {
  publishUtils.confirmPublishing(currentRepositoryStore.outlineActivities);
};

const exportRepository = () => {
  showExportModal.value = true;
};

const showDeleteConfirmation = () => {
  const repository = currentRepositoryStore.repository as Repository;
  confirmationDialog({
    title: 'Delete repository?',
    message: `Are you sure you want to delete repository ${repository.name}?`,
    action: async () => {
      await repositoryStore.remove(repository.id);
      navigateTo({ name: 'catalog' });
    },
  });
};

const onActionClick = (name: string) => {
  const actions = {
    publish: publishRepository,
    clone: clone,
    export: exportRepository,
    delete: showDeleteConfirmation,
  } as any;
  actions[name]();
};

onMounted(() => {
  if (currentRepositoryStore?.repository?.hasAdminAccess) return;
  navigateTo({ name: 'catalog' });
});
</script>
