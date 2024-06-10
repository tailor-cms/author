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
        <VProgressCircular v-if="loadingContent" class="mt-5" indeterminate />
        <SelectActivity
          v-else
          :activities="items.activities"
          :selected-elements="selection.elements"
          @selected="showActivityElements"
        />
      </template>
      <template v-else>
        <div v-if="toggleButton" class="d-flex justify-end mb-2 px-4">
          <VBtn variant="outlined" @click="toggleSelectAll">
            <VIcon class="mr-2">mdi-{{ toggleButton.icon }}</VIcon>
            {{ toggleButton.label }}
          </VBtn>
        </div>
        <v-progress-circular v-if="loadingContent" class="mt-5" indeterminate />
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
        variant="text"
        @click="deselectActivity"
      >
        <VIcon class="mr-2" dense>mdi-arrow-left</VIcon>Back
      </VBtn>
      <VBtn class="ml-1" variant="text" @click="close">Cancel</VBtn>
      <VBtn class="mr-2" variant="text" @click="save">{{ submitLabel }}</VBtn>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, reactive, ref, withDefaults } from 'vue';
import { activity as activityUtils } from '@tailor-cms/utils';
import flatMap from 'lodash/flatMap';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';

import ContentPreview from '../ContentPreview/index.vue';
import loader from '../../loader';
import SelectActivity from './SelectActivity.vue';
import SelectRepository from './SelectRepository.vue';
import TailorDialog from '../TailorDialog.vue';

const { getDescendants } = activityUtils;

const TOGGLE_BUTTON = {
  SELECT: { label: 'Select all', icon: 'checkbox-multiple-marked-outline' },
  DESELECT: { label: 'Deselect all', icon: 'checkbox-multiple-blank-outline' },
};

interface Props {
  allowedTypes: Array<string>;
  heading: string;
  multiple?: boolean;
  selected?: Array<any>;
  headerIcon?: string;
  submitLabel?: string;
  onlyCurrentRepo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: () => [],
  submitLabel: 'save',
  headerIcon: 'mdi-toy-brick-plus-outline',
  onlyCurrentRepo: false,
  multiple: true,
});
const emit = defineEmits(['selected', 'close']);

const loadingContent = ref(false);

const currentRepository = inject('$repository');
const api = inject('$api');
const schemaService = inject('$schemaService');
console.log(currentRepository);

const selection = reactive({
  repository: null,
  activity: null,
  elements: [],
});

const items = reactive({
  activities: [],
  contentContainers: [],
});

const elements = computed(() => {
  const elements = flatMap(items.contentContainers, 'elements');
  if (!props.allowedTypes.length) return elements;
  return elements.filter((it: any) => props.allowedTypes.includes(it.type));
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

const processedContainers = computed(() => {
  if (!selection.activity || !items.activities.length) return [];
  const containers = sortBy(items.activities.filter(isRootContainer), [
    getTypePosition,
    'position',
    'createdAt',
  ]);
  return flatMap(containers, (it: any) => [it, ...getSubcontainers(it)]);
});

const getContainerTypes = (type: string) => {
  return map((schemaService as any).getSupportedContainers(type), 'type');
};

const getTypePosition = ({ type }: { type: string }) => {
  return rootContainerTypes.value.indexOf(type);
};

const isRootContainer = ({
  parentId,
  type,
}: {
  parentId: string;
  type: string;
}) => {
  return (
    parentId === (selection.activity as any).id &&
    rootContainerTypes.value.includes(type)
  );
};

const getSubcontainers = (container: any) => {
  return sortBy(getDescendants(items.activities, container), 'position');
};

const showActivityElements = async (activity: any) => {
  selection.activity = activity;
  const elements = await fetchElements(processedContainers.value);
  items.contentContainers = processedContainers.value.map((container) => {
    return assignElements(container, activity, elements);
  });
};

const assignElements = (container: any, activity: any, elements: any) => {
  const containerElements = elements
    .filter((it: any) => it.activityId === container.id)
    .map((element: any) => ({ ...element, activity }));
  return { ...container, elements: sortBy(containerElements, 'position') };
};

const toggleElementSelection = (element) => {
  const { elements } = selection;
  const existing = elements.find(it => it.id === element.id);
  selection.elements = existing
    ? elements.filter(it => it.id !== element.id)
    : elements.concat(element);
};

const toggleSelectAll = () => {
  selection.elements = allElementsSelected.value ? [] : elements.value;
};

const deselectActivity = () => {
  selection.activity = null;
  items.contentContainers = [];
  selection.elements = [...props.selected];
};

const selectRepository = async (repository) => {
  selection.repository = repository;
  deselectActivity();
  items.activities =
    currentRepository.id === repository.id
      ? currentRepository.activities
      : await fetchActivities(repository);
};

const fetchActivities = loader(
  async function (repository: any) {
    return api.fetchActivities(repository.id);
  },
  'loadingContent',
  500,
);

const fetchElements = loader(
  async function (containers: any) {
    const { id: repositoryId } = selection.repository;
    const params = { ids: map(containers, 'id') };
    return api.fetchContentElements(repositoryId, params);
  },
  'loadingContent',
  500,
);

const save = () => {
  emit('selected', [...selection.elements]);
  close();
};

const close = () => emit('close');

const openInEditor = (elementId: number) => {
  const router = useRouter();
  const params = {
    activityId: selection.activity.id,
    id: selection.repository.id,
  };
  const route = { name: 'editor', params, query: { elementId } };
  const { href } = router.resolve(route);
  window.open(href, '_blank');
};

onMounted(() => {
  selection.elements = [...props.selected];
  selection.repository = currentRepository;
  items.activities = currentRepository.activities;
});
</script>
