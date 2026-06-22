<template>
  <VCard
    v-if="uploadStore.items.length"
    class="upload-indicator"
    elevation="8"
    rounded="lg"
  >
    <VCardItem class="py-3">
      <template #prepend>
        <VIcon icon="mdi-cloud-upload-outline" size="small" />
      </template>
      <VCardTitle class="text-body-medium font-weight-medium">
        {{ headerText }}
      </VCardTitle>
      <template #append>
        <VBtn
          v-if="uploadStore.hasCompleted"
          density="comfortable"
          icon="mdi-close"
          size="small"
          variant="text"
          @click="uploadStore.clearCompleted()"
        />
      </template>
    </VCardItem>
    <VDivider />
    <VList class="py-0" density="compact" max-height="320">
      <VListItem
        v-for="item in uploadStore.items"
        :key="item.id"
        class="upload-item py-2 px-4"
      >
        <template #prepend>
          <VIcon :color="iconColor(item)" :icon="iconFor(item)" size="small" />
        </template>
        <VListItemTitle class="text-body-medium">{{ item.name }}</VListItemTitle>
        <VListItemSubtitle class="text-body-small">
          {{ subtitleFor(item) }}
        </VListItemSubtitle>
        <VProgressLinear
          v-if="item.status === UploadStatus.Uploading"
          :model-value="item.progress"
          class="mt-1"
          color="primary"
          height="3"
          rounded
        />
        <template #append>
          <VBtn
            v-if="item.status !== UploadStatus.Uploading"
            density="comfortable"
            icon="mdi-close"
            size="x-small"
            variant="text"
            @click="uploadStore.dismiss(item.id)"
          />
        </template>
      </VListItem>
    </VList>
  </VCard>
</template>

<script lang="ts" setup>
import {
  type UploadItem,
  UploadStatus,
  useUploadStore,
} from '@/stores/uploads';
import { formatFileSize } from '@/components/repository/Assets/utils';

const uploadStore = useUploadStore();

const headerText = computed(() => {
  const count = uploadStore.activeCount;
  return count
    ? `Uploading ${count} item${count > 1 ? 's' : ''}…`
    : 'Uploads complete';
});

const iconFor = (item: UploadItem) => {
  if (item.status === UploadStatus.Done) return 'mdi-check-circle';
  if (item.status === UploadStatus.Error) return 'mdi-alert-circle';
  return 'mdi-file-upload-outline';
};

const iconColor = (item: UploadItem) => {
  if (item.status === UploadStatus.Done) return 'success';
  if (item.status === UploadStatus.Error) return 'error';
  return 'primary';
};

const subtitleFor = (item: UploadItem) => {
  if (item.status === UploadStatus.Error) return item.error ?? 'Upload failed';
  if (item.status === UploadStatus.Done) return formatFileSize(item.size);
  return `${item.progress}% of ${formatFileSize(item.size)}`;
};
</script>

<style lang="scss" scoped>
.upload-indicator {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  width: 22.5rem;
  max-width: calc(100vw - 3rem);
  text-align: left;
  z-index: 2000;
}
</style>
