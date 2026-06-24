<template>
  <div class="folder-bar d-flex align-center flex-wrap ga-2 mb-3">
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
          :class="{ 'text-medium-emphasis': isLast(index) }"
          class="crumb text-body-medium"
          role="button"
          @click="onCrumb(crumb, index)"
        >
          {{ crumb.label }}
        </span>
      </template>
    </nav>
    <VSpacer />
    <VBtn
      data-testid="newFolderBtn"
      prepend-icon="mdi-folder-plus-outline"
      size="small"
      text="New folder"
      variant="tonal"
      @click="showNewFolder = true"
    />
    <NewFolderDialog
      v-model="showNewFolder"
      :existing-names="existingNames"
      :parent-path="currentPath"
      @create="emit('create', $event)"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Breadcrumb } from '@/composables/useAssetFolders';
import NewFolderDialog from './NewFolderDialog.vue';

const props = defineProps<{
  breadcrumbs: Breadcrumb[];
  currentPath: string;
  existingNames: string[];
}>();

const emit = defineEmits<{
  'navigate': [path: string];
  'navigate-up': [];
  'create': [name: string];
}>();

const showNewFolder = ref(false);

// The last crumb is the current folder
const isLast = (index: number) => index === props.breadcrumbs.length - 1;

function onCrumb(crumb: Breadcrumb, index: number) {
  if (!isLast(index)) emit('navigate', crumb.path);
}
</script>

<style lang="scss" scoped>
.crumb {
  cursor: pointer;

  &.text-medium-emphasis {
    cursor: default;
  }
}
</style>
