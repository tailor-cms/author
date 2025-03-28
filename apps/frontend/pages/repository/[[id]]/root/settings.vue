<template>
  <div class="repository-settings">
    <VContainer class="h-100 pt-14" max-width="1400px">
      <VSheet color="primary-lighten-4" rounded="lg">
        <VRow>
          <VCol cols="3">
            <SettingsSidebar class="ml-4 my-3" @action="onActionClick" />
          </VCol>
          <VCol class="pl-8 pb-7" cols="9">
            <VSheet
              class="my-2 mr-5 h-100"
              color="primary-lighten-5"
              rounded="lg"
            >
              <NuxtPage />
            </VSheet>
          </VCol>
        </VRow>
      </VSheet>
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
    </VContainer>
    <AppFooter />
  </div>
</template>

<script lang="ts" setup>
import type { Repository } from '@tailor-cms/interfaces/repository';

import AppFooter from '@/components/common/AppFooter.vue';
import CloneModal from '@/components/repository/Settings/CloneModal.vue';
import ExportDialog from '@/components/repository/Settings/ExportModal.vue';
import ProgressDialog from '@/components/common/ProgressDialog.vue';
import SettingsSidebar from '@/components/repository/Settings/SettingsSidebar.vue';
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

const showCloneModal = ref(false);
const showExportModal = ref(false);
const publishPercentage = computed(
  () => publishUtils.status.value.progress * 100,
);

const clone = () => {
  showCloneModal.value = true;
};

const publishRepository = () => {
  publishUtils.publishRepository(currentRepositoryStore.outlineActivities);
};

const exportRepository = () => {
  showExportModal.value = true;
};

const showDeleteConfirmation = () => {
  const repository = currentRepositoryStore.repository as Repository;
  const { id, name } = repository;
  confirmationDialog({
    title: 'Delete repository?',
    message: `Are you sure you want to delete repository ${name}?`,
    action: async () => {
      await repositoryStore.remove(id);
      navigateTo('/');
    },
  });
};

const onActionClick = (name: string) => {
  const actions = {
    publish: publishRepository,
    clone,
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
