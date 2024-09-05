<template>
  <div class="content-containers">
    <h2 v-if="displayHeading" class="text-h5">{{ capitalize(name) }}</h2>
    <VAlert
      v-if="!containerGroup.length"
      color="primary-lighten-3"
      icon="mdi-information-outline"
      variant="tonal"
      prominent
    >
      Click the button below to create first {{ capitalize(name) }}.
    </VAlert>
    <component
      :is="containerName"
      v-for="(container, index) in containerGroup"
      :key="container?.uid"
      v-bind="$attrs"
      :activities="processedActivities"
      :config="config"
      :container="container"
      :disabled="showPublishDiff"
      :elements="processedElements"
      :name="name"
      :position="index"
      :repository="currentRepository.repository"
      :tes="elements"
      class="content-container"
      @add:element="(val: any) => saveContentElements([val])"
      @add:subcontainer="addContainer"
      @delete="requestContainerDeletion(container)"
      @delete:element="requestElementDeletion"
      @delete:subcontainer="requestContainerDeletion"
      @reorder:element="reorderContentElements"
      @save:element="saveContentElements"
      @update:element="(val: any) => saveContentElements([val])"
      @update:subcontainer="activityStore.update"
    />
    <div v-if="addBtnEnabled">
      <VBtn
        class="my-6"
        color="teal-accent-1"
        variant="tonal"
        @click="addContainer"
      >
        <VIcon class="pr-2">mdi-plus</VIcon>
        Create {{ name }}
      </VBtn>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getContainerName, getElementId } from '@tailor-cms/utils';
import type { Activity } from '@tailor-cms/interfaces/activity';
import BBPromise from 'bluebird';
import capitalize from 'lodash/capitalize';
import castArray from 'lodash/castArray';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import maxBy from 'lodash/maxBy';
import pluralize from 'pluralize';
import throttle from 'lodash/throttle';

import { useActivityStore } from '@/stores/activity';
import { useContentElementStore } from '@/stores/content-elements';
import { useCurrentRepository } from '@/stores/current-repository';
import { useEditorStore } from '@/stores/editor';

interface Props {
  type: string;
  label: string;
  parentId: number;
  processedActivities: Activity[];
  processedElements: Record<string, Element>;
  config?: Record<string, any>;
  templateId?: string;
  containerGroup?: Activity[];
  required?: boolean;
  multiple?: boolean;
  displayHeading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  templateId: '',
  config: () => ({}),
  containerGroup: () => [],
  required: true,
  multiple: false,
  displayHeading: false,
});

const emit = defineEmits(['focusoutElement', 'createdContainer']);

const { $schemaService, $ccRegistry } = useNuxtApp() as any;
const eventBus = inject('$eventBus') as any;

const notify = useNotification();
const showNotification = throttle((message) => notify(message), 2000);
const confirmationDialog = useConfirmationDialog();

const currentRepository = useCurrentRepository();
const activityStore = useActivityStore();
const contentElementStore = useContentElementStore();
const editorStore = useEditorStore();

const showPublishDiff = computed(() => editorStore.showPublishDiff);
const elements = computed(() => contentElementStore.items);

const containerName = computed(() => {
  const id = $schemaService.getContainerTemplateId(props);
  return getContainerName($ccRegistry.get(id) ? id : 'DEFAULT');
});

const name = computed(() => props.label.toLowerCase());

const addBtnEnabled = computed(() => {
  const isMultipleOrEmpty = props.multiple || !props.containerGroup.length;
  return !showPublishDiff.value && isMultipleOrEmpty;
});

const nextPosition = computed(() => {
  const last = get(maxBy(props.containerGroup, 'position'), 'position', 0);
  return last + 1;
});

const addContainer = async (data = {}) => {
  const { type, parentId } = props;
  const payload = {
    type,
    repositoryId: currentRepository.repositoryId,
    parentId,
    position: nextPosition.value,
    ...data,
  };
  await activityStore.save(payload);
  emit('createdContainer', payload);
};

const saveContentElements = (elements: ContentElement[]) => {
  const contentElements = castArray(elements);
  return BBPromise.map(contentElements, (element) =>
    persistElement(element),
  ).then(() => {
    const message = `${pluralize('Element', contentElements.length)} saved`;
    showNotification(message);
  });
};

const persistElement = async (element: ContentElement) => {
  const elementChannelName = `element:${getElementId(element)}`;
  const elementChannel = eventBus.channel(elementChannelName);
  try {
    await contentElementStore.save({
      ...element,
      repositoryId: currentRepository.repositoryId,
    });
    elementChannel.emit('saved');
  } catch (err) {
    elementChannel.emit('error', err);
    return Promise.reject(err);
  }
};

const reorderContentElements = ({
  newPosition,
  items,
}: {
  newPosition: number;
  items: ContentElement[];
}) => {
  const element = items[newPosition];
  const context = { items, newPosition };
  return contentElementStore.reorder({ element, context });
};

const requestDeletion = (
  content: Activity | ContentElement,
  action: (val: any) => Promise<undefined>,
  name: string,
  onDelete?: () => void,
) => {
  confirmationDialog({
    title: `Delete ${name}?`,
    message: `Are you sure you want to delete ${name}?`,
    action: () => action(content).then(onDelete),
  });
};

const requestContainerDeletion = (
  container: Activity,
  name: string = 'container',
) => {
  const action = (val: Activity) => activityStore.remove(val.id);
  requestDeletion(container, action, name);
};

const requestElementDeletion = (element: ContentElement) => {
  const action = (val: ContentElement) =>
    contentElementStore.remove(val.repositoryId, val.id);
  const onDelete = () => emit('focusoutElement');
  requestDeletion(element, action, 'element', onDelete);
};

onBeforeMount(() => {
  if (props.required && isEmpty(props.containerGroup)) addContainer();
});
</script>

<style lang="scss" scoped>
.content-containers {
  margin: 4.375rem 0;
}

.headline {
  margin: 3.125rem 0 1.25rem;
  padding: 0;
  text-align: left;
}

.content-container {
  width: 100%;
  min-height: 15.5rem;
  margin: 1.5rem 0;
  padding: 0.625rem;
  background-color: #fff;
}
</style>
