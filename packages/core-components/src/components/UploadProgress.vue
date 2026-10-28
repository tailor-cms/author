<template>
  <div class="upload-progress d-flex flex-column align-center justify-center">
    <VIcon
      class="mb-3"
      color="primary"
      icon="mdi-cloud-upload-outline"
      size="52"
    />
    <div class="text-title-medium text-truncate w-100 text-center mb-4">
      {{ isProcessing ? 'Processing' : 'Uploading' }} {{ fileName }}...
    </div>
    <VProgressLinear
      :indeterminate="!isTransferring"
      :model-value="progress ?? 0"
      class="upload-progress-bar"
      color="primary"
      height="6"
      rounded
    />
    <div v-if="isTransferring" class="text-body-small mt-2">{{ progress }}%</div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  fileName?: string;
  // Upload percent complete; null renders an indeterminate bar
  progress?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  fileName: '',
  progress: null,
});

const isTransferring = computed(
  () => props.progress !== null && props.progress < 100,
);
// Upload progress only tracks bytes sent, so it reaches 100% while the server
// is still storing the asset — show a processing state instead of pinning the
// bar at 100%.
const isProcessing = computed(() => props.progress === 100);
</script>

<style lang="scss" scoped>
.upload-progress {
  // Match the dropzone footprint to avoid a dialog height jump
  min-height: 16rem;
}

.upload-progress-bar {
  max-width: 22rem;
}
</style>
