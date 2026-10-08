<template>
  <div class="d-flex flex-wrap ga-2">
    <SharedAssetTile
      v-for="preview in previews"
      :key="`${preview.entityType}:${preview.entityId}`"
      :reference="preview"
    />
    <VSheet
      v-if="hiddenCount"
      :title="`${hiddenCount} more`"
      class="d-flex align-center justify-center text-medium-emphasis"
      color="surface-sunken"
      rounded="lg"
      width="4rem"
    >
      <span class="text-title-small">+{{ hiddenCount }}</span>
    </VSheet>
  </div>
</template>

<script lang="ts" setup>
import type { AttachmentPreview } from '@tailor-cms/interfaces/comment';

import SharedAssetTile from '../../SharedAssetTile.vue';

const props = defineProps<{
  previews: AttachmentPreview[];
  total?: number;
}>();

const hiddenCount = computed(() =>
  Math.max(0, (props.total ?? 0) - props.previews.length),
);
</script>
