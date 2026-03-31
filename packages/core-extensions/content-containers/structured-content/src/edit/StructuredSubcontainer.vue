<template>
  <VCard class="mb-8 py-2 px-5" elevation="4">
    <div
      :class="{
        'subcontainer-header-collapsible': isCollapsible,
        'mb-8': isExpanded,
      }"
      class="d-flex align-center mt-3 mx-1"
      @click="isCollapsible && toggleExpanded()"
    >
      <VCardTitle class="pb-4 text-primary-darken-3 text-truncate">
        <VIcon class="mr-2" color="primary-darken-4">{{ icon }}</VIcon>
        {{ label }}
        <span
          v-if="!isExpanded && collapsedPreviewText"
          class="ml-3 text-body-2 text-medium-emphasis font-weight-regular"
        >
          {{ collapsedPreviewText }}
        </span>
      </VCardTitle>
      <VSpacer />
      <VChip
        v-if="!isExpanded && elementCount"
        class="mr-2 flex-shrink-0"
        color="primary-lighten-1"
        size="x-small"
        variant="tonal"
      >
        {{ elementCount }} {{ elementCount === 1 ? 'element' : 'elements' }}
      </VChip>
      <VBtn
        v-if="isCollapsible"
        :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        class="mr-2"
        color="primary-darken-3"
        size="small"
        variant="text"
        @click.stop="toggleExpanded"
      />
      <VBtn
        v-if="isExpanded && !isDisabled"
        class="mr-5"
        color="secondary-darken-3"
        size="small"
        variant="tonal"
        @click.stop="emit('delete:subcontainer', container, label)"
      >
        Delete {{ label }}
      </VBtn>
    </div>
    <VExpandTransition>
      <div v-show="isExpanded">
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
          v-if="!disableContentElementList"
          v-bind="$attrs"
          :activities="activities"
          :container="container"
          :elements="elements"
          :is-disabled="isDisabled"
          :label="'content elements'"
          :layout="layout"
          :supported-element-config="contentElementConfig"
          @add:subcontainer="emit('add:subcontainer', $event)"
          @update:subcontainer="emit('update:subcontainer', $event)"
          @delete:subcontainer="emit('delete:subcontainer', $event)"
          @delete:element="(el, force) => emit('delete:element', el, force)"
          @reorder:element="emit('reorder:element', $event)"
        />
      </div>
    </VExpandTransition>
  </VCard>
</template>

<script lang="ts" setup>
import { cloneDeep, debounce } from 'lodash-es';
import { computed, ref, watch } from 'vue';

import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';

import MetaInput from './MetaInput.vue';
import StructuredContent from './StructuredContent.vue';

const props = defineProps<{
  container: Activity;
  activities: Record<string, Activity>;
  elements: Record<string, ContentElement>;
  label: string;
  icon: string;
  meta: any;
  isDisabled: boolean;
  layout?: boolean;
  contentElementConfig?: Array<any>;
  disableContentElementList?: boolean;
  isCollapsible?: boolean;
  expandAll?: boolean;
  collapsedPreviewKey?: string | null;
}>();

const emit = defineEmits([
  'add:subcontainer',
  'update:subcontainer',
  'delete:subcontainer',
  'reorder:element',
  'delete:element',
]);

const elementCount = computed(() => {
  return Object.values(props.elements).filter(
    (el) => el.activityId === props.container.id,
  ).length;
});

const isExpanded = ref(true);

const collapsedPreviewText = computed(() => {
  const key = props.collapsedPreviewKey || props.meta?.[0]?.key;
  return key ? props.container?.data?.[key] || '' : '';
});

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

watch(
  () => props.expandAll,
  (expanded) => {
    if (props.isCollapsible) isExpanded.value = !!expanded;
  },
);

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

.subcontainer-header-collapsible {
  cursor: pointer;
  user-select: none;
}
</style>
