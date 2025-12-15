<template>
  <VCard
    color="warning"
    variant="tonal"
    class="d-flex align-center flex-wrap text-left mt-4 pa-4 ga-4"
  >
    <div class="text-left text-black">
      <div class="text-h6 py-0">
        This content element's component is deprecated.
      </div>
      <div class="text-subtitle-2">
        It is recommended to migrate to a supported component. Be sure to
        review the content after migration.
      </div>
    </div>
    <VSpacer />
    <VBtn
      append-icon="mdi-sync"
      color="warning"
      text="Migrate"
      variant="flat"
      @click="showDialog = true"
    />
  </VCard>
  <TailorDialog
    v-model="showDialog"
    header-icon="mdi-sync"
    width="1200"
  >
    <template #header>Migrate component?</template>
    <template #body>
      <VRow>
        <VCol cols="6">
          <div class="text-subtitle-2 font-weight-bold mb-2">
            Current (Deprecated)
          </div>
          <VSheet class="preview-container pa-4 rounded" border>
            <component
              :is="componentName"
              :element="element"
              is-disabled
              is-readonly
            />
          </VSheet>
        </VCol>
        <VCol cols="6">
          <div class="text-subtitle-2 font-weight-bold mb-2">
            After Migration (Tiptap)
          </div>
          <VSheet class="preview-container pa-4 rounded" border>
            <component
              :is="tiptapComponentName"
              v-if="tiptapComponentName"
              :element="tiptapElement"
              is-disabled
              is-readonly
            />
          </VSheet>
        </VCol>
      </VRow>
    </template>
    <template #actions>
      <VBtn
        color="primary-darken-4"
        variant="text"
        :slim="false"
        @click="closeDialog"
      >
        Cancel
      </VBtn>
      <VBtn
        color="primary-darken-2"
        variant="tonal"
        :slim="false"
        @click="onMigrate"
      >
        Migrate
      </VBtn>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ElementRegistry } from '@tailor-cms/interfaces/schema';

import TailorDialog from './TailorDialog.vue';

const TIPTAP_TYPE = 'TIPTAP_HTML';

interface Props {
  element: ContentElement;
  componentName: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:element']);

const ceRegistry = inject<ElementRegistry>('$ceRegistry');

const showDialog = ref(false);

const tiptapManifest = computed(() => ceRegistry?.get(TIPTAP_TYPE));
const tiptapComponentName = computed(() => tiptapManifest.value?.componentName);
const tiptapElement = computed(() => ({
  ...props.element,
  type: 'TIPTAP_HTML',
}));

const closeDialog = () => {
  showDialog.value = false;
};

const onMigrate = () => {
  emit('update:element', { type: TIPTAP_TYPE });
  closeDialog();
};
</script>

<style lang="scss" scoped>
.preview-container {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}
</style>
