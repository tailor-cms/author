<template>
  <TailorDialog :model-value="true" header-icon="mdi-export" persistent>
    <template #header>Export {{ repository.name }}</template>
    <template #body>
      <VAlert v-bind="status" variant="tonal" prominent>
        {{ status.message }}
      </VAlert>
    </template>
    <template #actions>
      <VBtn color="primary-darken-4" variant="text" @click="close">Cancel</VBtn>
      <VBtn
        :disabled="status !== STATUS.READY"
        color="primary-darken-4"
        variant="text"
        @click="exportRepository"
      >
        Download
      </VBtn>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import type { Repository } from '@tailor-cms/interfaces/repository';
import { TailorDialog } from '@tailor-cms/core-components';

import { repository as api } from '@/api';

const props = defineProps<{ repository: Repository }>();
const emit = defineEmits(['close']);

const STATUS = {
  INIT: {
    icon: 'mdi-loading mdi-spin',
    color: 'primary-darken-2',
    message: 'Please wait while repository export is being prepared...',
  },
  READY: {
    icon: 'mdi-download',
    color: 'primary-darken-2',
    message: 'Repository export is ready. Click button below to download...',
  },
  ERROR: {
    icon: 'mdi-alert-circle-outline',
    color: 'secondary-lighten-1',
    message: 'Something went wrong. Please try again later.',
  },
};

const jobId = ref(null);
const status = ref(STATUS.INIT);

const exportRepository = async () => {
  await api.exportRepository(props.repository.id, jobId.value);
  close();
};

const setStatus = (val: { icon: string; color: string; message: string }) => {
  status.value = val;
};

const getStatus = async (jobId: string | null, hits = 1) => {
  const MAX_HITS = 6;
  const INTERVAL = 3000;
  const { isCompleted } = await api.getExportJobStatus(
    props.repository.id,
    jobId,
  );
  if (isCompleted) return setStatus(STATUS.READY);
  if (hits >= MAX_HITS) return setStatus(STATUS.ERROR);
  return setTimeout(() => getStatus(jobId, hits + 1), hits * INTERVAL);
};

const initiateExportJob = async () => {
  try {
    jobId.value = await api.initiateExportJob(props.repository.id);
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
