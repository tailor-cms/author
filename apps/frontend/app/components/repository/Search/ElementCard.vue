<template>
  <VCard
    :class="{ 'pb-3': !showPreview }"
    :ripple="false"
    color="surface-raised"
    class="element-card text-start"
    elevation="1"
    rounded="lg"
    variant="flat"
  >
    <div class="d-flex align-center px-4 pt-3">
      <VAvatar
        class="flex-shrink-0"
        color="tertiary"
        rounded="lg"
        variant="tonal"
        size="40"
      >
        <VIcon :icon="manifest?.ui?.icon ?? 'mdi-toy-brick-outline'" size="20" />
      </VAvatar>
      <div class="ml-3 overflow-hidden">
        <div class="text-title-small text-truncate">
          {{ manifest?.name ?? element.type }}
        </div>
        <div
          v-if="breadcrumbs.length"
          class="d-flex align-center text-body-medium text-medium-emphasis"
        >
          <template v-for="(name, index) in breadcrumbs" :key="index">
            <VIcon
              v-if="index"
              class="mx-1"
              icon="mdi-chevron-right"
              size="14"
            />
            <span class="text-truncate">{{ name }}</span>
          </template>
        </div>
      </div>
      <VSpacer />
      <span
        class="text-body-small text-medium-emphasis text-no-wrap ml-3"
        data-percy="hide"
      >
        {{ formatDate(element.updatedAt) }}
      </span>
      <VBtn
        v-if="editorRoute"
        aria-label="Open in new tab"
        class="ml-4"
        color="primary"
        density="comfortable"
        size="small"
        variant="text"
        icon="mdi-open-in-new"
        @click.stop="openInNewTab"
      />
      <VBtn
        :aria-label="isExpanded ? 'Collapse preview' : 'Expand preview'"
        :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        class="ml-1"
        density="comfortable"
        variant="text"
        @click.stop="isExpanded = !isExpanded"
      />
    </div>
    <SearchSnippet
      v-if="element.searchSnippet"
      :snippet="element.searchSnippet"
      class="mx-4 mt-3"
    />
    <div v-if="showPreview" class="preview-region mx-4 my-3">
      <CardPreview :element="element" :search-terms="searchTerms" />
      <VBtn
        aria-label="Expand preview"
        class="expand-btn"
        density="comfortable"
        icon="mdi-arrow-expand"
        size="small"
        variant="elevated"
        @click.stop="emit('element:preview', element)"
      />
    </div>
  </VCard>
</template>

<script lang="ts" setup>
import { type SearchElement, useElementLocation } from './composables';
import { formatDate } from '@/components/repository/Assets/utils';
import CardPreview from './CardPreview.vue';
import SearchSnippet from './SearchSnippet.vue';

const props = defineProps<{
  element: SearchElement;
  searchTerms?: string[];
  isCompact?: boolean;
}>();
const emit = defineEmits<{
  'element:preview': [element: SearchElement];
}>();

const { $ceRegistry } = useNuxtApp() as any;

const manifest = computed(() => $ceRegistry.getByEntity(props.element));
const { breadcrumbs, editorRoute } = useElementLocation(() => props.element);

const isExpanded = ref(!props.isCompact);

watch(
  () => props.isCompact,
  (compact) => {
    isExpanded.value = !compact;
  },
);

const showPreview = computed(() => isExpanded.value);

const openInNewTab = () => {
  if (editorRoute.value) {
    navigateTo(editorRoute.value, { open: { target: '_blank' } });
  }
};
</script>

<style lang="scss" scoped>
.preview-region {
  position: relative;

  .expand-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &:hover .expand-btn,
  .expand-btn:focus-visible {
    opacity: 1;
  }
}
</style>
