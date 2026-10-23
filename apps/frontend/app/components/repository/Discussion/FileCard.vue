<template>
  <VCard
    :ripple="false"
    class="file-card"
    max-width="22rem"
    rounded="lg"
    color="surface-base"
    variant="flat"
    border
    @click="openFile"
  >
    <VCardItem class="pa-3">
      <template #prepend>
        <VAvatar
          :color="color"
          class="me-1"
          rounded="lg"
          size="40"
          variant="tonal"
        >
          <VIcon :icon="icon" size="22" />
        </VAvatar>
      </template>
      <div :title="asset.name" class="text-title-small text-truncate">
        {{ asset.name }}
      </div>
      <div class="text-body-small text-medium-emphasis text-truncate">
        <span class="file-card-type">{{ label }}</span>
        <span class="file-card-open">Open {{ label.toLowerCase() }}</span>
        <template v-if="size"> · {{ size }}</template>
      </div>
      <template v-if="href" #append>
        <VBtn
          v-tooltip:top="'Open in library'"
          :to="href"
          aria-label="Open in library"
          class="file-card-action"
          icon="mdi-folder-image"
          rounded="lg"
          size="x-small"
          variant="flat"
          @click.stop
        />
      </template>
    </VCardItem>
  </VCard>
</template>

<script lang="ts" setup>
import {
  formatFileSize,
  getAssetColor,
  getAssetIcon,
  getAssetLabel,
} from '@tailor-cms/core-components';

// A shared file, drawn as a row rather than a link preview; opens on click
const props = defineProps<{
  asset: any;
  href?: string;
}>();

const { download: openFile } = useAssetDownload(() => props.asset);

const icon = computed(() => getAssetIcon(props.asset));
const color = computed(() => getAssetColor(props.asset));
const label = computed(() => getAssetLabel(props.asset));

const size = computed(() => {
  const { fileSize } = props.asset.meta ?? {};
  return fileSize ? formatFileSize(fileSize) : null;
});
</script>

<style lang="scss" scoped>
.file-card-action {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.file-card:hover .file-card-action,
.file-card-action:focus-visible {
  opacity: 1;
}

// The type turns into the click's action
.file-card-open,
.file-card:is(:hover, :focus-visible) .file-card-type {
  display: none;
}

.file-card:is(:hover, :focus-visible) .file-card-open {
  display: inline;
}
</style>
