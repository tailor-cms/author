<template>
  <div>
    <div class="d-flex items-center justify-end ga-2 mb-6">
      <VBtn
        v-if="isAiEnabled && !isAiGeneratingContent && !disabled"
        color="secondary"
        size="small"
        variant="tonal"
        text="Generate content"
        append-icon="mdi-shimmer"
        @click="generateStructuredContent"
      />
      <span
        v-if="isCollapsible && subcontainers.length > 1 && !disabled"
        v-show="!isAiGeneratingContent"
        class="d-flex justify-end"
      >
        <VBtn
          :text="expandAll ? 'Collapse all' : 'Expand all'"
          rounded="lg"
          size="small"
          variant="tonal"
          width="90"
          @click="toggleAll"
        />
      </span>
    </div>
    <div v-if="isAiGeneratingContent" class="py-8">
      <CircularProgress />
      <div class="pt-3">Generating structured content...</div>
    </div>
    <VAlert
      v-if="!subcontainers.length && !isAiGeneratingContent"
      :text="disabled
        ? 'Empty structured content'
        : 'Click the button below to add a first content section.'"
      icon="mdi-information-outline"
      variant="outlined"
      prominent
    />
    <div
      v-for="subcontainer in subcontainers"
      v-show="!isAiGeneratingContent"
      :key="subcontainer.id"
      class="subcontainer-list-item mb-4"
    >
      <StructuredSubcontainer
        v-bind="subcontainerConfig[subcontainer.type]"
        :activities="activities"
        :container="subcontainer"
        :content-element-config="getContentElementConfig(subcontainer.type)"
        :elements="elements"
        :expand-all="expandAll"
        :is-disabled="disabled"
        :is-first="isFirst(subcontainer.id)"
        :is-last="isLast(subcontainer.id)"
        @add:element="emit('add:element', $event)"
        @delete:element="(el, force) => emit('delete:element', el, force)"
        @delete:subcontainer="emit('delete:subcontainer', $event)"
        @reorder:element="emit('reorder:element', $event)"
        @reorder:subcontainer="(direction: number) => reorder(subcontainer.id, direction)"
        @save:element="emit('save:element', $event)"
        @update:subcontainer="emit('update:subcontainer', $event)"
      />
    </div>
    <div
      v-if="!disabled"
      v-show="!isAiGeneratingContent"
      class="d-flex justify-center flex-wrap ga-3 mt-8"
    >
      <VBtn
        v-for="subcontainerType in subcontainerTypes"
        :key="subcontainerType"
        :text="`Add ${subcontainerConfig[subcontainerType].label}`"
        color="secondary"
        variant="tonal"
        prepend-icon="mdi-plus"
        :append-icon="subcontainerConfig[subcontainerType].icon"
        @click="createSubcontainer(subcontainerType)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, ref } from 'vue';
import { cloneDeep, filter, find, findIndex } from 'lodash-es';
import { AiRequestType, AiResponseSchema } from '@tailor-cms/interfaces/ai';
import { CircularProgress } from '@tailor-cms/core-components';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';

import type { Activity } from '@tailor-cms/interfaces/activity.js';
import type { ContentElement } from '@tailor-cms/interfaces/content-element.js';
import type { Repository } from '@tailor-cms/interfaces/repository.js';

import { parseConfig } from './config.ts';
import StructuredSubcontainer from './StructuredSubcontainer.vue';

interface Props {
  repository: Repository;
  activities: Record<string, Activity>;
  container: Activity;
  elements: Record<string, ContentElement>;
  config: any;
  disabled?: boolean;
  embedElementConfig?: ContentElementCategory[];
  contentElementConfig?: ContentElementCategory[];
  disableAi?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  disableAi: false,
});

const emit = defineEmits([
  'add:element',
  'save:element',
  'delete:element',
  'reorder:element',
  'add:subcontainer',
  'update:subcontainer',
  'delete:subcontainer',
]);

const doTheMagic = inject<any>('$doTheMagic');
const createActivity = inject<any>('$createActivity');

const isAiEnabled = computed(() => !props.disableAi && !!doTheMagic);
const isAiGeneratingContent = ref(false);

const containerParent = computed(() =>
  find(props.activities, { id: props.container.parentId as number }),
);

const subcontainers = computed(() => {
  const items = filter(props.activities, { parentId: props.container.id });
  return items.sort((a, b) => a.position - b.position);
});

const parsedConfig = computed(() => {
  const { repository, container, config } = props;
  return parseConfig(repository, containerParent.value, container, config);
});

const subcontainerConfig = computed(() => parsedConfig.value.subcontainers);
const subcontainerTypes = computed(() => Object.keys(subcontainerConfig.value || []));
const defaultSubcontainers = computed(() => parsedConfig.value.defaultSubcontainers);

const initDefaultSubcontainers = () => {
  if (subcontainers.value.length > 0 || !defaultSubcontainers.value.length) return;
  defaultSubcontainers.value.forEach((item: any, index: number) => {
    const typeConfig = subcontainerConfig.value[item.type];
    const initData = typeConfig?.initMeta?.() || {};
    emit('add:subcontainer', {
      type: item.type,
      parentId: props.container.id,
      position: index + 1,
      data: { ...initData, ...item.data },
    });
  });
};
onMounted(initDefaultSubcontainers);

const isCollapsible = computed(() => parsedConfig.value.isCollapsible);
const expandAll = ref(true);
const toggleAll = () => {
  expandAll.value = !expandAll.value;
};

const nextPosition = computed(() => {
  if (!subcontainers.value.length) return 1;
  const lastSubcontainer = subcontainers.value[subcontainers.value.length - 1];
  return lastSubcontainer.position + 1;
});

const isFirst = (id: number) => {
  return subcontainers.value[0]?.id === id;
};

const isLast = (id: number) => {
  return subcontainers.value[subcontainers.value.length - 1]?.id === id;
};

const reorder = (id: number, step: number) => {
  const containerIndex = findIndex(subcontainers.value, { id });
  const container = cloneDeep(subcontainers.value[containerIndex]);
  const target = cloneDeep(subcontainers.value[containerIndex + step]);
  const { position: newPosition } = target;
  target.position = container.position;
  container.position = newPosition;
  emit('update:subcontainer', target);
  emit('update:subcontainer', container);
};

const createSubcontainer = (type: string) => {
  const parentId = props.container.id;
  const position = nextPosition.value;
  const data = subcontainerConfig.value[type]?.initMeta?.();
  emit('add:subcontainer', { type, parentId, position, data });
};

const getContentElementConfig = (subcontainerType: string) => {
  return (
    subcontainerConfig.value[subcontainerType]?.contentElementConfig ||
    props.contentElementConfig
  );
};

const generateStructuredContent = async () => {
  isAiGeneratingContent.value = true;
  try {
    const result = await doTheMagic({
      containerType: props.container.type,
      inputs: [
        {
          type: AiRequestType.Create,
          text: 'Generate structured content with metadata, and content elements.',
          responseSchema: AiResponseSchema.StructuredContent,
        },
      ],
    });
    if (!result?.length) return;
    // Remove existing subcontainers before populating with AI content
    subcontainers.value.forEach((sub) => {
      emit('delete:subcontainer', sub, { force: true });
    });
    const { id: parentId, repositoryId } = props.container;
    let position = 1;
    for (const it of result) {
      const activity = await createActivity({
        type: it.type || subcontainerTypes.value[0],
        parentId,
        position: position++,
        data: it.data || {},
      });
      if (!activity || !it.elements?.length) continue;
      it.elements.forEach((element: any, index: number) => {
        emit('save:element', {
          ...element,
          position: index + 1,
          activityId: activity.id,
          repositoryId,
        });
      });
    }
  } finally {
    isAiGeneratingContent.value = false;
  }
};
</script>
