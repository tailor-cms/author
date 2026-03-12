<template>
  <div class="bg-primary-darken-3">
    <div
      v-if="isAiEnabled && !disabled && !isAiGeneratingContent"
      :class="{
        'pr-2 pb-0': !subcontainers?.length,
        'pr-12 pb-6': !!subcontainers?.length,
      }"
      class="d-flex flex-wrap justify-end"
    >
      <VBtn
        color="teal-lighten-4"
        size="small"
        variant="tonal"
        @click="generateStructuredContent"
      >
        Do the magic
        <VIcon end>mdi-magic-staff</VIcon>
      </VBtn>
    </div>
    <VSheet
      v-if="isAiGeneratingContent"
      class="bg-transparent pt-8 pb-8 rounded-lg text-subtitle-2 text-center"
    >
      <CircularProgress />
      <div class="pt-3 text-primary-lighten-4 font-weight-bold">
        <span>Generating structured content...</span>
      </div>
    </VSheet>
    <VAlert
      v-if="!subcontainers.length && !isAiGeneratingContent"
      class="my-8"
      color="primary-lighten-4"
      icon="mdi-information-outline"
      variant="outlined"
      prominent
    >
      Click the button below to add a first content section.
    </VAlert>
    <VRow
      v-for="subcontainer in subcontainers"
      v-show="!isAiGeneratingContent"
      :key="subcontainer.id"
      class="subcontainer-list"
    >
      <VCol>
        <StructuredSubcontainer
          v-bind="config[subcontainer.type]"
          :activities="activities"
          :elements="elements"
          :container="subcontainer"
          :is-disabled="disabled"
          :content-element-config="getContentElementConfig(subcontainer.type)"
          @add:element="emit('add:element', $event)"
          @save:element="emit('save:element', $event)"
          @delete:element="(el, force) => emit('delete:element', el, force)"
          @reorder:element="emit('reorder:element', $event)"
          @update:subcontainer="emit('update:subcontainer', $event)"
          @delete:subcontainer="emit('delete:subcontainer', $event)"
        />
      </VCol>
      <VCol class="px-1 py-2 flex-grow-0">
        <VBtn
          :disabled="isFirst(subcontainer.id)"
          class="mb-3"
          color="primary-lighten-5"
          density="comfortable"
          icon="mdi-chevron-up"
          variant="tonal"
          @click="reorder(subcontainer.id, Direction.UP)"
        />
        <VBtn
          :disabled="isLast(subcontainer.id)"
          color="primary-lighten-5"
          density="comfortable"
          icon="mdi-chevron-down"
          variant="tonal"
          @click="reorder(subcontainer.id, Direction.DOWN)"
        />
      </VCol>
    </VRow>
    <VRow v-show="!isAiGeneratingContent" class="py-8 pr-14 justify-center">
      <VBtn
        v-for="subcontainerType in subcontainerTypes"
        :key="subcontainerType"
        class="mr-3"
        color="teal-lighten-4"
        min-width="200"
        variant="tonal"
        @click="createSubcontainer(subcontainerType)"
      >
        <div class="pr-2">
          <VIcon size="x-small">mdi-plus</VIcon>
          <VIcon size="small">{{ config[subcontainerType].icon }}</VIcon>
        </div>
        Add {{ config[subcontainerType].label }}
      </VBtn>
    </VRow>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import { cloneDeep, filter, find, findIndex } from 'lodash-es';
import { AiRequestType, AiResponseSchema } from '@tailor-cms/interfaces/ai';
import { CircularProgress } from '@tailor-cms/core-components';
import type { ContentElementCategory } from '@tailor-cms/interfaces/schema';

import type { Activity } from '@tailor-cms/interfaces/activity.js';
import type { ContentElement } from '@tailor-cms/interfaces/content-element.js';
import type { Repository } from '@tailor-cms/interfaces/repository.js';

import { parseConfig } from './config';
import StructuredSubcontainer from './StructuredSubcontainer.vue';

const Direction = { UP: -1, DOWN: 1 };

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

const config = computed(() => {
  const { repository, container, config } = props;
  return parseConfig(repository, containerParent.value, container, config);
});

const subcontainerTypes = computed(() => Object.keys(config.value || []));

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
  const data = config.value[type]?.initMeta?.();
  emit('add:subcontainer', { type, parentId, position, data });
};

const getContentElementConfig = (subcontainerType: string) => {
  return (
    props.config[subcontainerType]?.contentElementConfig ||
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
    const { id: parentId, repositoryId } = props.container;
    let position = nextPosition.value;
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
