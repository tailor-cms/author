<template>
  <div ref="rootRef" class="preview-clip">
    <VThemeProvider theme="light">
      <VLazy min-height="96" transition="fade-transition">
        <VSheet
          v-if="hasRenderError"
          class="preview-fallback d-flex flex-column align-center justify-center pa-8"
          color="surface-container"
          rounded="lg"
        >
          <VIcon icon="mdi-eye-off-outline" size="32" />
          <span class="mt-2 text-body-medium">Preview unavailable</span>
        </VSheet>
        <VSheet v-else class="preview-scale py-3" color="surface" rounded="lg">
          <ContentElementWrapper :element="element" is-disabled />
        </VSheet>
      </VLazy>
    </VThemeProvider>
  </div>
</template>

<script lang="ts" setup>
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { ContentElement as ContentElementWrapper } from '@tailor-cms/core-components';
import { useSearchHighlight } from './composables';

const props = defineProps<{
  element: ContentElement;
  searchTerms?: string[];
}>();

const rootRef = ref<HTMLElement>();
const hasRenderError = ref(false);

useSearchHighlight(rootRef, computed(() => props.searchTerms ?? []));

onErrorCaptured(() => {
  hasRenderError.value = true;
  return false;
});
</script>

<style lang="scss" scoped>
.preview-clip {
  position: relative;
  pointer-events: none;
}

.preview-scale {
  zoom: 0.8;
}

:deep(.frame) {
  border: none;
}
</style>
