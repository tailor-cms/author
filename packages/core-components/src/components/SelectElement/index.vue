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
          :content-containers="items.contentContainers"
          :filters="filters"
          :multiple="multiple"
          :selected="selection.elements"
          selectable
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
import type {
  Activity,
} from '@tailor-cms/interfaces/activity';
import { computed, inject, onMounted, reactive } from 'vue';
import type {
  ContentElement,
  Relationship,
} from '@tailor-cms/interfaces/content-element';
import type { ElementRegistry, Filter } from '@tailor-cms/interfaces/schema';
import { activity as activityUtils } from '@tailor-cms/utils';
import flatMap from 'lodash/flatMap';
import map from 'lodash/map';
import type { Repository } from '@tailor-cms/interfaces/repository';
import sortBy from 'lodash/sortBy';

import ContentPreview from '../ContentPreview/index.vue';
import TailorDialog from '../TailorDialog.vue';
import { useLoader } from '../../composables/useLoader';
import SelectActivity from './SelectActivity.vue';
import SelectRepository from './SelectRepository.vue';

const TOGGLE_BUTTON = {
  SELECT: { label: 'Select all', icon: 'checkbox-multiple-marked-outline' },
  DESELECT: { label: 'Deselect all', icon: 'checkbox-multiple-blank-outline' },
};

interface Props {
  element?: ContentElement | null;
  allowedElementConfig: Array<{ type: string; config: any }>;
  heading: string;
  multiple?: boolean;
  selected?: Relationship[];
  filters?: Filter[];
  headerIcon?: string;
  submitLabel?: string;
  onlyCurrentRepo?: boolean;
}

interface Selection {
  repository?: Repository;
  activity?: Activity;
  elements: (ContentElement | Relationship)[];
}

interface Items {
  activities: Activity[];
  contentContainers: Activity[];
}

const props = withDefaults(defineProps<Props>(), {
  element: null,
  selected: () => [],
  filters: () => [],
  submitLabel: 'save',
  headerIcon: 'mdi-toy-brick-plus-outline',
  onlyCurrentRepo: false,
  multiple: true,
});
const emit = defineEmits(['selected', 'close']);

const api = inject<any>('$api');
const ceRegistry = inject<ElementRegistry>('$ceRegistry');
const currentRepository = inject<any>('$repository');
const schemaService = inject<any>('$schemaService');

const { loading, loader } = useLoader();

const selection: Selection = reactive({
  repository: undefined,
  activity: undefined,
  elements: [],
});

const items: Items = reactive({
  activities: [],
  contentContainers: [],
});

const elements = computed(() => flatMap(items.contentContainers, 'elements'));

const allElementsSelected = computed(
  () => selection.elements.length === elements.value.length,
);

const toggleButton = computed(() => {
  if (!props.multiple || !selection.activity || !elements.value.length) return;
  const { SELECT, DESELECT } = TOGGLE_BUTTON;
  return allElementsSelected.value ? DESELECT : SELECT;
});

const rootContainerTypes = computed(() => {
  if (!selection.activity) return [];
  return getContainerTypes(selection.activity.type);
});

const processedContainers = computed<Activity[]>(() => {
  if (!selection.activity || !items.activities.length) return [];
  const containers = sortBy(items.activities.filter(isRootContainer), [
    getTypePosition,
    'position',
    'createdAt',
  ]) as Activity[];
  return flatMap(containers, (it) => [it, ...getSubcontainers(it)]);
});

const getContainerTypes = (type: string) => {
  return map(schemaService.getSupportedContainers(type), 'type');
};

const getTypePosition = ({ type }: { type: string }) => {
  return rootContainerTypes.value.indexOf(type);
};

const isRootContainer = ({ parentId, type }: Activity) => {
  if (!selection.activity) return false;
  return (
    parentId === selection.activity.id &&
    rootContainerTypes.value.includes(type)
  );
};

const getSubcontainers = (container: Activity) => {
  const { getDescendants } = activityUtils;
  return sortBy(
    getDescendants(items.activities, container) as Activity[],
    'position',
  );
};

const showActivityElements = async (activity: Activity) => {
  selection.activity = activity;
  const elements: ContentElement[] = await fetchElements(
    processedContainers.value,
  );
  items.contentContainers = processedContainers.value.map((container) => {
    return assignElements(container, activity, elements);
  });
};

const assignElements = (
  container: Activity,
  activity: Activity,
  elements: ContentElement[],
) => {
  const { filters = [] } = props;
  const containerElements = elements
    .filter((el) => {
      if (el.activityId !== container.id) return false;
      if (!isAllowedType(el)) return false;
      if (!props.element) return true;
      return filters.every((filter) =>
        filter(el, props.element as ContentElement, ceRegistry),
      );
    })
    .map((element) => ({ ...element, activity }));
  return { ...container, elements: sortBy(containerElements, 'position') };
};

const isAllowedType = (el: ContentElement) => {
  if (!props.allowedElementConfig.length) return true;
  return props.allowedElementConfig.some((it: any) => {
    const sameType = it.type === ceRegistry?.getByEntity(el).type;
    const isGradable = ceRegistry?.isGradableQuestion(el);
    const sameConfig = it.config.isGradable === isGradable;
    return sameType && sameConfig;
  });
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
  const isCurrentRepository = currentRepository.value.id === repository.id;
  const activities: Activity[] = isCurrentRepository
    ? currentRepository.value.activities
    : await fetchActivities(repository);
  items.activities = activities.filter((it) => !it.deletedAt);
};

const fetchActivities = loader(async function (repository: Repository) {
  return api.fetchActivities(repository.id);
}, 500);

const fetchElements = loader(async function (containers: Activity[]) {
  const repositoryId = selection.repository?.id;
  const params = { ids: map(containers, 'id') };
  return api.fetchContentElements(repositoryId, params);
}, 500);

const save = () => {
  emit('selected', [...selection.elements]);
  close();
};

const close = () => emit('close');

onMounted(() => {
  selection.elements = [...props.selected];
  selectRepository(currentRepository.value);
});
</script>
