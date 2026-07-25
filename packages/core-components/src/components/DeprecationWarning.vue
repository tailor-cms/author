<template>
  <VAlert
    class="deprecation-warning text-body-small flex-0-1"
    color="warning"
    density="compact"
    variant="tonal"
  >
    <span>Deprecated — migrate to {{ updatedComponentMeta?.name }}.</span>
    <VSpacer />
    <VBtn
      color="warning"
      prepend-icon="mdi-eye-outline"
      size="small"
      text="Preview"
      variant="text"
      @click="showDialog = true"
    />
    <TailorDialog
      v-model="showDialog"
      :retain-focus="false"
      title="Element Preview"
      header-icon="mdi-eye-outline"
      width="1100"
    >
      <template #body>
        <div class="text-body-medium text-medium-emphasis mb-4">
          Here is how this element will look after you migrate it to
          {{ updatedComponentMeta?.name }}.
        </div>
        <VSheet class="preview-container pa-4" rounded="lg" border>
          <component
            :is="updatedComponentMeta.componentName"
            v-if="updatedComponentMeta?.componentName"
            :element="updatedElement"
            is-disabled
            is-readonly
          />
        </VSheet>
      </template>
      <template #actions>
        <VBtn text="Close" variant="text" @click="closeDialog" />
      </template>
    </TailorDialog>
  </VAlert>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ElementRegistry } from '@tailor-cms/interfaces/schema';

import { MIGRATIONS } from '../utils/deprecated-elements';
import TailorDialog from './TailorDialog.vue';

const props = defineProps<{ element: ContentElement }>();

const ceRegistry = inject<ElementRegistry>('$ceRegistry');

const showDialog = ref(false);

const updatedElement = computed(() => MIGRATIONS[props.element.type](props.element));
const updatedComponentMeta = computed(() => ceRegistry?.get(updatedElement.value.type));

const closeDialog = () => {
  showDialog.value = false;
};
</script>

<style lang="scss" scoped>
.preview-container {
  min-height: 12.5rem;
  max-height: 25rem;
  overflow-y: auto;
}

:deep(.v-alert__content) {
  display: flex;
  flex-grow: 1;
  align-items: center;
  gap: 0.625rem;
}
</style>
