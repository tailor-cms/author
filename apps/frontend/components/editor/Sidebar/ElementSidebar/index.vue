<template>
  <div class="element-sidebar">
    <div class="pb-4 text-body-2 font-weight-bold text-primary-lighten-4">
      Additional settings
    </div>
    <component :is="sidebarName" :element="element" @save="onSave" />
    <ElementMeta :element="element" v-bind="metadata" />
  </div>
</template>

<script lang="ts" setup>
import { getElementId, getSidebarName } from '@tailor-cms/utils';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { schema } from 'tailor-config-shared';

import ElementMeta from './ElementMeta/index.vue';
import { exposedApi } from '@/api';

const eventBus = inject('$eventBus') as any;
const authStore = useAuthStore();
const storageService = useStorageService();

interface Props {
  element: ContentElement;
  metadata?: any;
}
const props = withDefaults(defineProps<Props>(), {
  metadata: () => ({}),
});

const elementBus = eventBus.channel(`element:${getElementId(props.element)}`);
const editorChannel = eventBus.channel('editor');
provide('$elementBus', elementBus);
provide('$editorBus', editorChannel);
provide('$storageService', storageService);
provide('$api', exposedApi);
provide('$schemaService', schema);
provide('$getCurrentUser', () => authStore.user);

const sidebarName = getSidebarName(props.element?.type);

const onSave = (data: any) => elementBus.emit('save', data);
</script>

<style lang="scss" scoped>
$error-color: rgb(var(--v-theme-secondary-lighten-4));

.element-sidebar {
  padding: 1.75rem 0.875rem 1.5rem;

  h3 {
    margin: 0 0.25rem 1.5rem;
  }

  :deep(.v-input--error) {
    .v-messages__message,
    .v-field__outline,
    .v-field-label {
      color: $error-color !important;
    }
  }
}
</style>
