<template>
  <VMenu
    v-model="isOpen"
    :close-delay="120"
    :open-delay="350"
    location="top"
    max-width="360"
    offset="6"
    open-on-hover
  >
    <template #activator="{ props: menuProps }">
      <MessageToken
        v-bind="menuProps"
        :href="href"
        :icon="icon"
        :label="token.label"
        kind="reference"
      />
    </template>
    <VCard class="reference-preview" rounded="lg">
      <div class="d-flex align-center ga-2 px-3 py-2">
        <VIcon :icon="icon" color="info" size="small" />
        <span class="text-label-large font-weight-semibold text-truncate">
          {{ preview?.title ?? token.label }}
        </span>
        <VSpacer />
        <span
          v-if="preview?.subtitle"
          class="text-body-small text-medium-emphasis flex-shrink-0"
        >
          {{ preview.subtitle }}
        </span>
      </div>
      <VDivider />
      <div v-if="isLoading" class="d-flex justify-center py-6">
        <VProgressCircular color="primary" indeterminate size="22" />
      </div>
      <div
        v-else-if="!preview"
        class="text-body-small text-medium-emphasis px-3 py-4"
      >
        This item is no longer available.
      </div>
      <VImg
        v-else-if="preview.imageUrl"
        :src="preview.imageUrl"
        class="reference-preview-image"
        cover
      />
      <div v-else-if="preview.element" class="reference-preview-body pa-3">
        <CardPreview :element="preview.element" />
      </div>
    </VCard>
  </VMenu>
</template>

<script lang="ts" setup>
import type { ReferenceToken } from '@tailor-cms/utils';

import CardPreview from '@/components/repository/Search/CardPreview.vue';
import { MessageToken } from '@tailor-cms/core-components';
import { useAsyncState } from '@vueuse/core';
import { useReferencePreview } from '../composables/useReferencePreview';
import { referenceHref } from '@/utils/entityLinks';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{ token: ReferenceToken; icon: string }>();

const repoStore = useCurrentRepository();
const { resolve } = useReferencePreview();

const href = computed(() =>
  referenceHref(repoStore.repositoryId, props.token),
);

const isOpen = ref(false);

const {
  state: preview,
  isLoading,
  isReady,
  execute: load,
} = useAsyncState(() => resolve(props.token), null, { immediate: false });

watch(isOpen, (open) => {
  if (open && !isReady.value && !isLoading.value) load();
});
</script>

<style lang="scss" scoped>
.reference-preview-image {
  max-height: 14rem;
}

.reference-preview-body {
  max-height: 16rem;
  overflow: hidden;

  :deep(*) {
    pointer-events: none;
  }
}
</style>
