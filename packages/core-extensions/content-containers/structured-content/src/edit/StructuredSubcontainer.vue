<template>
  <VCard class="mb-8 py-2 px-5" elevation="4">
    <div class="d-flex align-center mt-3 mx-1 mb-8">
      <VCardTitle class="text-primary-darken-3 text-truncate">
        <VIcon class="mr-2" color="primary-darken-4">
          {{ icon }}
        </VIcon>
        {{ label }}
      </VCardTitle>
      <VSpacer />
      <VBtn
        class="mr-5"
        color="secondary-darken-3"
        size="small"
        variant="tonal"
        @click="emit('delete:subcontainer', container, label)"
      >
        Delete {{ label }}
      </VBtn>
    </div>
    <VRow v-if="processedMeta.length">
      <VCol
        v-for="input in processedMeta"
        :key="input.key"
        :cols="input.cols || 12"
        class="pt-0 pb-3 px-8"
      >
        <MetaInput
          :meta="input"
          @update="(key, val) => (containerData[key] = val)"
        />
      </VCol>
    </VRow>
    <StructuredContent
      v-bind="$attrs"
      :activities="activities"
      :categories="categories"
      :container="container"
      :elements="elements"
      :is-disabled="isDisabled"
      :label="'content elements'"
      :layout="layout"
      :supported-types="elementTypes"
      @add:subcontainer="emit('add:subcontainer', $event)"
      @update:subcontainer="emit('update:subcontainer', $event)"
      @delete:subcontainer="emit('delete:subcontainer', $event)"
      @delete:element="emit('delete:element', $event)"
      @reorder:element="emit('reorder:element', $event)"
    />
  </VCard>
</template>

<script lang="ts" setup>
import { cloneDeep, debounce } from 'lodash';
import { computed, ref, watch } from 'vue';

import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ElementCategory } from '@tailor-cms/interfaces/schema';

import MetaInput from './MetaInput.vue';
import StructuredContent from './StructuredContent.vue';

const props = defineProps<{
  container: Activity;
  activities: Record<string, Activity>;
  elements: Record<string, ContentElement>;
  label: string;
  layout: boolean;
  icon: string;
  meta: any;
  elementTypes: Array<any>;
  categories: ElementCategory[];
  isDisabled: boolean;
}>();

const emit = defineEmits([
  'add:subcontainer',
  'update:subcontainer',
  'delete:subcontainer',
  'reorder:element',
  'delete:element',
]);

const containerData = ref({ ...props.container?.data }) as any;

const processedMeta = computed(() =>
  props.meta.map((meta: any) => {
    return { ...meta, value: containerData.value[meta.key] };
  }),
);

const save = debounce(() => {
  const container = cloneDeep(props.container);
  container.data = { ...containerData.value };
  emit('update:subcontainer', container);
}, 500);

watch(containerData, save, { deep: true });
</script>

<style lang="scss" scoped>
.meta-container :deep(.v-messages) {
  text-align: left;
}
</style>
