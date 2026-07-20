<template>
  <TailorDialog
    :model-value="true"
    :title="`Export ${repositoryTypeLabel}`"
    header-icon="mdi-export"
    persistent
  >
    <template #body>
      <VAlert
        :class="{ 'pa-0': !isError }"
        :color="isError ? 'error' : undefined"
        :icon="status.icon"
        :text="status.message"
        :variant="isError ? 'tonal' : 'text'"
        prominent
      />
    </template>
    <template #actions>
      <VBtn text="Cancel" variant="text" @click="close" />
      <VBtn
        :disabled="status.message !== STATUS.READY.message"
        color="primary"
        text="Download"
        variant="flat"
        @click="exportRepository"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import type { Repository } from '@tailor-cms/interfaces/repository';

import { schema as schemaApi } from '@tailor-cms/config';
import { TailorDialog } from '@tailor-cms/core-components';

import { api } from '@/api';

const props = defineProps<{ repository: Repository }>();
const emit = defineEmits(['close']);

const notify = useNotification();

const { name } = props.repository;
const repositoryTypeLabel = schemaApi.getLabel(props.repository);

interface ExportStatus {
  icon: string;
  message: string;
  isError?: boolean;
}

const STATUS: Record<'INIT' | 'READY' | 'ERROR', ExportStatus> = {
  INIT: {
    icon: 'mdi-loading mdi-spin',
    message: `Preparing the "${name}" export...`,
  },
  READY: {
    icon: 'mdi-download-circle-outline',
    message: `The "${name}" export is ready to download.`,
  },
  ERROR: {
    icon: 'mdi-alert-circle-outline',
    isError: true,
    message: 'Something went wrong. Please try again later.',
  },
};

const jobId = ref<string | null>(null);
const status = ref(STATUS.INIT);
const isError = computed(() => !!status.value.isError);

const exportRepository = () => {
  if (!jobId.value) return;
  // GET endpoint streams a tgz with `Content-Disposition: attachment`,
  // so the browser handles the download natively
  const url = `/api/repositories/${props.repository.id}/export/${jobId.value}`;
  window.open(url, '_blank');
  notify(`The ${repositoryTypeLabel} has been exported`);
  close();
};

const setStatus = (val: ExportStatus) => {
  status.value = val;
};

const getStatus = async (jobId: string | null, hits = 1) => {
  const MAX_HITS = 6;
  const INTERVAL = 3000;
  const { isCompleted, isFailed, error } =
    await api.repository.getExportStatus({
      params: { repositoryId: props.repository.id, jobId: jobId! },
    });
  if (isCompleted) return setStatus(STATUS.READY);
  if (isFailed) {
    return setStatus({
      ...STATUS.ERROR,
      message: error || STATUS.ERROR.message,
    });
  }
  if (hits >= MAX_HITS) return setStatus(STATUS.ERROR);
  return setTimeout(() => getStatus(jobId, hits + 1), hits * INTERVAL);
};

const initiateExportJob = async () => {
  try {
    jobId.value = await api.repository.initiateExport({
      params: { repositoryId: props.repository.id },
    });
    return getStatus(jobId.value);
  } catch {
    status.value = STATUS.ERROR;
  }
};

onMounted(() => {
  initiateExportJob();
});

const close = () => {
  emit('close');
};
</script>
