<template>
  <div class="folder-breadcrumbs d-flex align-center flex-wrap ga-2 mb-3">
    <VBtn
      v-tooltip:bottom="'Up one level'"
      :disabled="!currentPath"
      aria-label="Up one level"
      icon="mdi-arrow-up"
      size="small"
      variant="text"
      density="comfortable"
      @click="emit('navigate-up')"
    />
    <nav class="d-flex align-center flex-wrap" aria-label="Folder path">
      <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
        <VIcon
          v-if="index"
          class="mx-1 text-medium-emphasis"
          icon="mdi-chevron-right"
          size="small"
        />
        <span
          :class="
            isLast(index)
              ? 'crumb--current text-high-emphasis'
              : 'text-medium-emphasis'
          "
          class="crumb text-title-small"
          role="button"
          @click="onCrumb(crumb, index)"
        >
          {{ crumb.label }}
        </span>
      </template>
    </nav>
  </div>
</template>

<script lang="ts" setup>
import type { Breadcrumb } from '@/composables/useAssetFolders';

const props = defineProps<{
  breadcrumbs: Breadcrumb[];
  currentPath: string;
}>();

const emit = defineEmits<{
  'navigate': [path: string];
  'navigate-up': [];
}>();

// The last crumb is the current folder
const isLast = (index: number) => index === props.breadcrumbs.length - 1;

function onCrumb(crumb: Breadcrumb, index: number) {
  if (!isLast(index)) emit('navigate', crumb.path);
}
</script>

<style lang="scss" scoped>
.crumb {
  cursor: pointer;

  &:not(.crumb--current):hover {
    text-decoration: underline;
  }

  &.crumb--current {
    cursor: default;
    font-weight: 500;
  }
}
</style>
