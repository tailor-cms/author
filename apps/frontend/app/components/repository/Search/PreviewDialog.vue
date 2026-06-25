<template>
  <TailorDialog
    :header-icon="manifest?.ui?.icon ?? 'mdi-magnify-expand'"
    :model-value="true"
    :title="manifest?.name ?? element.type"
    width="1000"
    scrollable
    @close="emit('close')"
  >
    <template #body>
      <div
        v-if="breadcrumbs.length"
        class="d-flex align-center flex-wrap text-body-medium text-medium-emphasis mb-4"
      >
        <template v-for="(name, index) in breadcrumbs" :key="index">
          <VIcon v-if="index" class="mx-1" icon="mdi-chevron-right" size="14" />
          <span>{{ name }}</span>
        </template>
      </div>
      <VSheet
        v-if="hasRenderError"
        class="d-flex flex-column align-center justify-center pa-12"
        color="surface-container"
        rounded="lg"
      >
        <VIcon icon="mdi-eye-off-outline" size="32" />
        <span class="text-body-medium mt-2">Preview unavailable</span>
      </VSheet>
      <div v-else ref="rootRef">
        <VThemeProvider class="pa-6 rounded-lg" theme="light" with-background>
          <ContentElementWrapper :element="element" is-disabled />
        </VThemeProvider>
      </div>
    </template>
    <template #actions>
      <VBtn text="Close" variant="text" @click="emit('close')" />
      <VBtn
        v-if="editorRoute"
        color="primary"
        append-icon="mdi-arrow-right"
        text="Open in editor"
        variant="flat"
        @click="emit('element:navigate', element, editorRoute)"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router';
import {
  ContentElement as ContentElementWrapper,
  TailorDialog,
} from '@tailor-cms/core-components';
import {
  useElementLocation,
  useSearchHighlight,
  type SearchElement,
} from './composables';

const props = defineProps<{
  element: SearchElement;
  searchTerms?: string[];
}>();

const emit = defineEmits<{
  'close': [];
  'element:navigate': [element: SearchElement, route: RouteLocationRaw];
}>();

const { $ceRegistry } = useNuxtApp() as any;
const rootRef = ref<HTMLElement>();
const hasRenderError = ref(false);

const manifest = computed(() => $ceRegistry.getByEntity(props.element));
const { breadcrumbs, editorRoute } = useElementLocation(() => props.element);

useSearchHighlight(rootRef, computed(() => props.searchTerms ?? []));

onErrorCaptured(() => {
  hasRenderError.value = true;
  return false;
});
</script>
