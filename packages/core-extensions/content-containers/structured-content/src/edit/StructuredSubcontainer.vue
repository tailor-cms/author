<template>
  <VCard color="grey-lighten-5" flat>
    <div
      :class="{ 'subcontainer-header-collapsible': isCollapsible }"
      class="subcontainer-header d-flex align-center mx-1 pa-4"
      @click="isCollapsible && toggleExpanded()"
    >
      <VCardTitle class="d-flex align-center pa-0 text-truncate">
        <VIcon class="mr-2" color="primary-darken-4" size="20">{{ icon }}</VIcon>
        {{ label }}
        <span
          v-if="!isExpanded && collapsedPreviewText"
          class="ml-2 text-body-medium text-medium-emphasis text-truncate"
        >
          {{ collapsedPreviewText }}
        </span>
      </VCardTitle>
      <VSpacer />
      <VChip
        v-if="!isExpanded && elementCount && !disableContentElementList"
        class="mr-2"
        color="primary-darken-1"
        size="small"
        variant="tonal"
      >
        {{ elementCount }} {{ elementCount === 1 ? 'element' : 'elements' }}
      </VChip>
      <template v-if="canReorder">
        <VBtn
          :disabled="isFirst"
          aria-label="Move section up"
          density="compact"
          icon="mdi-arrow-up-circle-outline"
          variant="text"
          @click.stop="emit('reorder:subcontainer', -1)"
        />
        <VBtn
          :disabled="isLast"
          aria-label="Move section down"
          density="compact"
          icon="mdi-arrow-down-circle-outline"
          variant="text"
          @click.stop="emit('reorder:subcontainer', 1)"
        />
        <VDivider class="mx-4 my-1" vertical />
      </template>
      <VBtn
        v-if="!isDisabled"
        class="mr-2"
        color="secondary"
        density="comfortable"
        icon="mdi-delete-outline"
        size="small"
        variant="tonal"
        @click.stop="emit('delete:subcontainer', container, label)"
      />
      <VBtn
        v-if="isCollapsible"
        :aria-label="isExpanded ? 'Collapse section' : 'Expand section'"
        :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        color="primary-darken-3"
        density="comfortable"
        variant="text"
        @click.stop="toggleExpanded"
      />
    </div>
    <VExpandTransition>
      <div v-show="isExpanded">
        <VRow v-if="processedMeta.length" class="px-2" no-gutters>
          <VCol
            v-for="input in processedMeta"
            :key="input.key"
            :cols="input.cols || 12"
            class="px-4"
          >
            <MetaInput
              :meta="input"
              @update="(key, val) => (containerData[key] = val)"
            />
          </VCol>
        </VRow>
        <VSheet
          v-if="!disableContentElementList"
          class="px-4 pt-5"
          color="white"
          border="t"
        >
          <StructuredContent
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
        </VSheet>
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
  collapsedPreviewKey?: string | null;
  expandAll?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}>();

const emit = defineEmits([
  'add:subcontainer',
  'update:subcontainer',
  'delete:subcontainer',
  'reorder:subcontainer',
  'reorder:element',
  'delete:element',
]);

const canReorder = computed(
  () => !props.isDisabled && !(props.isFirst && props.isLast),
);

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

watch(
  () => props.expandAll,
  (expanded) => {
    if (props.isCollapsible) isExpanded.value = !!expanded;
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.meta-container :deep(.v-messages) {
  text-align: left;
}

.subcontainer-header-collapsible {
  cursor: pointer;
  user-select: none;
}

.subcontainer-header {
  min-height: 3rem;
}

.v-card-title {
  font-size: 1.125rem;
  font-weight: 500;
}
</style>
