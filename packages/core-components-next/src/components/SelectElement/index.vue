<template>
  <TailorDialog
    :header-icon="headerIcon"
    :model-value="true"
    width="650"
    persistent
    scrollable
  >
    <template #header>{{ heading }}</template>
    <template #body>
      <template v-if="!selection.activity">
        <SelectRepository
          :disabled="onlyCurrentRepo"
          :repository="selection.repository"
          @selected="selectRepository"
        />
        <VSheet v-if="loading" class="text-center pa-8" color="transparent">
          <VProgressCircular class="mt-5" color="primary" indeterminate />
        </VSheet>
        <SelectActivity
          v-else
          :activities="items.activities"
          :selected-elements="selection.elements"
          @selected="showActivityElements"
        />
      </template>
      <template v-else>
        <div v-if="toggleButton" class="d-flex justify-end mb-4">
          <VBtn
            :prepend-icon="`mdi-${toggleButton.icon}`"
            variant="tonal"
            @click="toggleSelectAll"
          >
            {{ toggleButton.label }}
          </VBtn>
        </div>
        <VSheet v-if="loading" class="text-center pa-8" color="transparent">
          <VProgressCircular class="mt-5" color="primary" indeterminate />
        </VSheet>
        <ContentPreview
          v-else
          :allowed-types="allowedTypes"
          :content-containers="items.contentContainers"
          :multiple="multiple"
          :selected="selection.elements"
          selectable
          @element:open="openInEditor"
          @toggle="toggleElementSelection"
        />
      </template>
    </template>
    <template #actions>
      <VBtn
        v-if="selection.activity"
        class="mr-2"
        color="primary-darken-4"
        prepend-icon="mdi-arrow-left"
        variant="text"
        @click="deselectActivity"
      >
        Back
      </VBtn>
      <VBtn color="primary-darken-4" variant="text" @click="close">
        Cancel
      </VBtn>
      <VBtn class="ml-2" color="primary-darken-2" variant="tonal" @click="save">
        {{ submitLabel }}
      </VBtn>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, reactive, withDefaults } from 'vue';
import { activity as activityUtils } from '@tailor-cms/utils';
import flatMap from 'lodash/flatMap';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';

import type { Activity, ContentContainer } from '../../interfaces/activity';
import type { ContentElement } from '../../interfaces/content-element';
import ContentPreview from '../ContentPreview/index.vue';
import type { Repository } from '../../interfaces/repository';
import SelectActivity from './SelectActivity.vue';
import SelectRepository from './SelectRepository.vue';
import TailorDialog from '../TailorDialog.vue';
import { useLoader } from '../../composables/useLoader';

const { getDescendants } = activityUtils;

const TOGGLE_BUTTON = {
  SELECT: { label: 'Select all', icon: 'checkbox-multiple-marked-outline' },
  DESELECT: { label: 'Deselect all', icon: 'checkbox-multiple-blank-outline' },
};

interface Props {
  allowedTypes: Array<string>;
  heading: string;
  multiple?: boolean;
  selected?: Array<ContentElement>;
  headerIcon?: string;
  submitLabel?: string;
  onlyCurrentRepo?: boolean;
}

interface Selection {
  repository?: Repository;
  activity?: Activity;
  elements: Array<ContentElement>;
}

interface Items {
  activities: Activity[];
  contentContainers?: ContentContainer[];
}

interface CurrentRepository extends Repository {
  activities: Activity[];
}

const props = withDefaults(defineProps<Props>(), {
  selected: () => [],
  submitLabel: 'save',
  headerIcon: 'mdi-toy-brick-plus-outline',
  onlyCurrentRepo: false,
  multiple: true,
});
const emit = defineEmits(['selected', 'close']);

const { loading, loader } = useLoader();

const currentRepository = inject<CurrentRepository>('$repository');
const api = inject<any>('$api');
const schemaService = inject<any>('$schemaService');

const selection: Selection = reactive({
  repository: undefined,
  activity: undefined,
  elements: [],
});

const items: Items = reactive({
  activities: [],
  contentContainers: [],
});

const elements = computed(() => {
  const elements: ContentElement[] = flatMap(
    items.contentContainers,
    'elements',
  );
  if (!props.allowedTypes.length) return elements;
  return elements.filter((it) => props.allowedTypes.includes(it.type));
});

const allElementsSelected = computed(
  () => selection.elements.length === elements.value.length,
);

const toggleButton = computed(() => {
  if (!props.multiple || !selection.activity || !elements.value.length) return;
  const { SELECT, DESELECT } = TOGGLE_BUTTON;
  return allElementsSelected.value ? DESELECT : SELECT;
});

const rootContainerTypes = computed(() => {
  const type = selection.activity?.type;
  return type && getContainerTypes(type);
});

const processedContainers = computed<ContentContainer[]>(() => {
  if (!selection.activity || !items.activities.length) return [];
  const containers = sortBy(items.activities.filter(isRootContainer), [
    getTypePosition,
    'position',
    'createdAt',
  ]) as ContentContainer[];
  return flatMap(containers, (it) => [it, ...getSubcontainers(it)]);
});

const getContainerTypes = (type: string) => {
  return map((schemaService as any).getSupportedContainers(type), 'type');
};

const getTypePosition = ({ type }: { type: string }) => {
  return rootContainerTypes.value?.indexOf(type);
};

const isRootContainer = ({ parentId, type }: Activity) => {
  return (
    parentId === (selection.activity as any).id &&
    rootContainerTypes.value?.includes(type)
  );
};

const getSubcontainers = (container: any) => {
  return sortBy(getDescendants(items.activities, container), 'position');
};

const showActivityElements = async (activity: any) => {
  selection.activity = activity;
  const elements: ContentElement[] = await fetchElements(
    processedContainers.value,
  );
  items.contentContainers = processedContainers.value.map((container) => {
    return assignElements(container, activity, elements);
  });
};

const assignElements = (
  container: ContentContainer,
  activity: Activity,
  elements: ContentElement[],
) => {
  const containerElements = elements
    .filter((it: any) => it.activityId === container.id)
    .map((element: any) => ({ ...element, activity }));
  return { ...container, elements: sortBy(containerElements, 'position') };
};

const toggleElementSelection = (element: ContentElement) => {
  const { elements } = selection;
  const existing = elements.find((it) => it.id === element.id);
  selection.elements = existing
    ? elements.filter((it) => it.id !== element.id)
    : elements.concat(element);
};

const toggleSelectAll = () => {
  selection.elements = allElementsSelected.value ? [] : elements.value;
};

const deselectActivity = () => {
  selection.activity = undefined;
  items.contentContainers = [];
  selection.elements = [...props.selected];
};

const selectRepository = async (repository: Repository) => {
  selection.repository = repository;
  deselectActivity();
  items.activities =
    currentRepository?.id === repository.id
      ? currentRepository.activities
      : await fetchActivities(repository);
};

const fetchActivities = loader(async function (repository: any) {
  return api.fetchActivities(repository.id);
}, 500);

const fetchElements = loader(async function (containers: ContentContainer[]) {
  const repositoryId = selection.repository?.id;
  const params = { ids: map(containers, 'id') };
  return api.fetchContentElements(repositoryId, params);
}, 500);

const save = () => {
  emit('selected', [...selection.elements]);
  close();
};

const close = () => emit('close');

const openInEditor = (elementId: number) => {
  const { repository, activity } = selection;
  if (!repository || !activity) return;
  const url = new URL(
    `/repository/${repository.id}/editor/${activity.id}`,
    window.location.href,
  );
  url.searchParams.set('elementId', elementId.toString());
  window.open(url.href, '_blank');
};

onMounted(() => {
  selection.elements = [...props.selected];
  selection.repository = currentRepository;
  items.activities = currentRepository?.activities || [];
});
</script>
