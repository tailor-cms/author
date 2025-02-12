<template>
  <div :key="getElementId(element)" elevation="6">
    <ElementToolbar
      v-if="element.parent"
      :element="element.parent"
      :embed="element"
    >
      <template #embed-toolbar>
        <ElementToolbar :element="element" />
      </template>
    </ElementToolbar>
    <ElementToolbar v-else :element="element" />
  </div>
</template>

<script lang="ts" setup>
import { getElementId } from '@tailor-cms/utils';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';

import ElementToolbar from './ElementToolbar.vue';

const props = defineProps<{ element: ContentElement }>();

const elementBus = useContentElementBus(props.element);
const storageService = useStorageService();

provide('$elementBus', elementBus);
provide('$storageService', storageService);
</script>
