<template>
  <VList
    :selected="selectedIds"
    class="asset-list"
    color="primary-darken-4"
    rounded
    @click:select="onSelect"
  >
    <VListItem
      v-for="asset in assets"
      :key="asset.id"
      :value="asset.id"
      class="pa-3"
    >
      <template #prepend>
        <VAvatar
          v-if="asset.publicUrl && asset.type === AssetType.Image"
          class="mr-3"
          rounded="lg"
          size="52"
        >
          <VImg :src="asset.publicUrl" cover />
        </VAvatar>
        <VAvatar
          v-else
          class="mr-3"
          color="primary-lighten-5"
          rounded="lg"
          size="52"
        >
          <VIcon :icon="getIcon(asset.type)" color="primary-darken-2" size="26" />
        </VAvatar>
      </template>
      <VListItemTitle class="text-body-2">{{ asset.name }}</VListItemTitle>
      <VListItemSubtitle v-if="'fileSize' in asset.meta" class="text-caption">
        {{ formatSize((asset.meta as FileAssetMeta).fileSize) }}
      </VListItemSubtitle>
      <template #append>
        <VCheckboxBtn
          v-if="multiple"
          :model-value="selectedIds.includes(asset.id)"
          color="primary-darken-2"
          density="compact"
          @click.stop="emit('toggle', asset)"
        />
        <VIcon
          v-else-if="selectedIds.includes(asset.id)"
          class="mr-2"
          color="primary-darken-2"
          icon="mdi-check-circle"
        />
      </template>
    </VListItem>
  </VList>
</template>

<script lang="ts" setup>
import {
  AssetType,
  type Asset,
  type FileAssetMeta,
} from '@tailor-cms/interfaces/asset.ts';

const ICON_MAP: Record<string, string> = {
  image: 'mdi-file-image',
  video: 'mdi-file-video',
  audio: 'mdi-file-music',
  document: 'mdi-file-document',
  other: 'mdi-file',
};

defineProps<{
  assets: Asset[];
  selectedIds: number[];
  multiple?: boolean;
}>();

const emit = defineEmits(['select', 'toggle']);

const getIcon = (type: string) => ICON_MAP[type] || ICON_MAP.other;

const formatSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const onSelect = ({ id }: { id: unknown }) => emit('select', id as number);
</script>

<style lang="scss" scoped>
.asset-list {
  max-height: 40vh;
  overflow-y: auto;
  background: transparent;
}
</style>
