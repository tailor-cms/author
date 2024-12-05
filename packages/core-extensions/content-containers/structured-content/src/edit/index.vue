<template>
  <div class="bg-primary-darken-3">
    <VAlert
      v-if="!subcontainers.length"
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
          @add:element="emit('add:element', $event)"
          @save:element="emit('save:element', $event)"
          @delete:element="emit('delete:element', $event)"
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
    <VRow class="py-8 pr-14 justify-center">
      <VBtn
        v-for="subcontainerType in subcontainerTypes"
        :key="subcontainerType"
        color="teal-lighten-4"
        min-width="200"
        variant="tonal"
        @click="createSubcontainer(subcontainerType)"
      >
        <div class="mr-2">
          <VIcon x-small>mdi-plus</VIcon>
          <VIcon small>{{ config[subcontainerType].icon || 'mdi-text' }}</VIcon>
        </div>
        Add {{ config[subcontainerType].label }}
      </VBtn>
    </VRow>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { cloneDeep, filter, find, findIndex } from 'lodash';

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
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
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
  const data = config[type]?.initMeta();
  emit('add:subcontainer', { type, parentId, position, data });
};
</script>
