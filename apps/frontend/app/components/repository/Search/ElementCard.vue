<template>
  <VCard
    color="surface-raised"
    class="element-card text-start"
    elevation="1"
    rounded="lg"
    variant="flat"
  >
    <VCard
      :ripple="false"
      class="d-flex align-center pa-3"
      color="transparent"
      rounded="0"
      flat
      @click="onCardClick"
    >
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
        <div class="text-label-large font-weight-semibold text-truncate">
          {{ manifest?.name ?? element.type }}
        </div>
        <div
          v-if="breadcrumbs.length"
          class="d-flex align-center text-label-medium text-medium-emphasis"
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
      <VIcon
        :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        class="mx-2"
      />
    </VCard>
    <SearchSnippet
      v-if="element.searchSnippet"
      :snippet="element.searchSnippet"
      class="mx-4 mt-3"
    />
    <VExpandTransition>
      <div v-if="showPreview" class="preview-region mx-4 mb-3">
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
    </VExpandTransition>
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

const onCardClick = () => {
  isExpanded.value = !isExpanded.value;
};

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
