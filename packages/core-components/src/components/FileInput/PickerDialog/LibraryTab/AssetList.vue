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
      :disabled="!isCompatible(asset)"
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
          <VIcon
            :icon="getAssetIcon(asset.type)"
            color="primary-darken-2"
            size="26"
          />
        </VAvatar>
      </template>
      <VListItemTitle class="text-body-2">{{ asset.name }}</VListItemTitle>
      <VListItemSubtitle
        v-if="!isCompatible(asset)"
        class="text-caption text-medium-emphasis"
      >
        Unsupported format
      </VListItemSubtitle>
      <VListItemSubtitle
        v-else-if="'fileSize' in asset.meta"
        class="text-caption"
      >
        {{ formatFileSize((asset.meta as FileAssetMeta).fileSize) }}
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
import { computed } from 'vue';

import {
  AssetType,
  type Asset,
  type FileAssetMeta,
} from '@tailor-cms/interfaces/asset.ts';
import { getAssetIcon, formatFileSize } from '#utils';

const props = defineProps<{
  assets: Asset[];
  selectedIds: number[];
  allowedExtensions?: string[];
  multiple?: boolean;
}>();

const emit = defineEmits<{
  select: [id: number];
  toggle: [asset: Asset];
}>();

// Normalize extensions to a Set for fast lookup (strip leading dots, lowercase)
const allowedExtensionsSet = computed(() => {
  if (!props.allowedExtensions?.length) return null;
  return new Set(
    props.allowedExtensions.map((e) => e.replace(/^\./, '').toLowerCase()),
  );
});

const isCompatible = (asset: Asset): boolean => {
  if (!allowedExtensionsSet.value) return true;
  const ext = (asset.meta as any)?.extension;
  if (!ext) return true;
  return allowedExtensionsSet.value.has(ext);
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
