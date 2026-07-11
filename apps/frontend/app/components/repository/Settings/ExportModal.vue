<template>
  <TailorDialog
    :model-value="true"
    :title="`Export ${repository.name}`"
    header-icon="mdi-export"
    persistent
  >
    <template #body>
      <VAlert v-bind="status" :text="status.message" variant="tonal" prominent />
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

const STATUS = {
  INIT: {
    icon: 'mdi-loading mdi-spin',
    message: 'Please wait while repository export is being prepared...',
  },
  READY: {
    icon: 'mdi-download-circle-outline',
    color: '',
    message: 'Repository export is ready. Click button below to download...',
  },
  ERROR: {
    icon: 'mdi-alert-circle-outline',
    color: 'error',
    message: 'Something went wrong. Please try again later.',
  },
};

const jobId = ref<string | null>(null);
const status = ref(STATUS.INIT);

const exportRepository = () => {
  if (!jobId.value) return;
  // GET endpoint streams a tgz with `Content-Disposition: attachment`,
  // so the browser handles the download natively
  const url = `/api/repositories/${props.repository.id}/export/${jobId.value}`;
  window.open(url, '_blank');
  const type = schemaApi.getSchema(props.repository.schema).name;
  notify(`The ${type.toLowerCase()} has been exported`, { immediate: true });
  close();
};

const setStatus = (val: { icon: string; color: string; message: string }) => {
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
