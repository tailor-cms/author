<template>
  <TailorDialog
    v-model="visible"
    header-icon="mdi-link-variant"
    title="Link existing content"
    width="650"
    persistent
  >
    <template #body>
      <p class="text-body-medium text-medium-emphasis mb-5">
        The selected content will be linked {{ destination }}.
      </p>
      <VAutocomplete
        :items="repositories"
        :loading="isLoadingRepositories"
        :menu-props="{ maxWidth: '100%' }"
        :label="sourceLabel"
        :model-value="selectedRepository"
        :placeholder="sourcePlaceholder"
        item-title="name"
        item-value="id"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        return-object
        @update:model-value="selectRepository"
        @update:search="fetchRepositories"
      />
      <div v-if="isLoadingActivities" class="text-center pa-4">
        <VProgressCircular color="primary" indeterminate />
      </div>
      <RepositoryTree
        v-else-if="selectedRepository"
        :activities="repositoryActivities"
        :schema-name="schemaName"
        :supported-levels="supportedLevels"
        @change="selectedActivities = $event"
      />
    </template>
    <template #actions>
      <VBtn
        :disabled="isLinking"
        text="Cancel"
        variant="text"
        @click="close"
      />
      <VBtn
        :disabled="!selectedActivities.length || isLinking"
        :loading="isLinking"
        :text="linkBtnLabel"
        class="ml-2"
        color="primary"
        variant="flat"
        @click="linkSelection"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { Repository } from '@tailor-cms/interfaces/repository';

import { TailorDialog, useLoader } from '@tailor-cms/core-components';
import { InsertLocation } from '@tailor-cms/utils';
import { sortBy, upperFirst } from 'lodash-es';
import { storeToRefs } from 'pinia';
import pluralize from 'pluralize-esm';

import { api } from '@/api';
import { describeSelection } from '@/utils/describeSelection';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';
import RepositoryTree from '../Outline/CopyActivity/RepositoryTree.vue';

const { AddAfter, AddInto } = InsertLocation;

interface Props {
  anchor?: Activity | null;
  action?: InsertLocation;
}

const emit = defineEmits(['close', 'completed']);
const props = withDefaults(defineProps<Props>(), {
  action: InsertLocation.AddAfter,
  anchor: null,
});

const { $schemaService } = useNuxtApp() as any;

const currentRepositoryStore = useCurrentRepository();
const activityStore = useActivityStore();
const notify = useNotification();

const { loading: isLoadingRepositories, loader } = useLoader();
const { repository } = storeToRefs(currentRepositoryStore);

const visible = ref(true);
const repositories = ref<Repository[]>([]);
const selectedRepository = ref<Repository | null>(null);
const repositoryActivities = ref<Activity[]>([]);
const selectedActivities = ref<Activity[]>([]);
const isLoadingActivities = ref(false);
const isLinking = ref(false);

const schemaName = computed(() => {
  if (!selectedRepository.value) return '';
  return $schemaService.getLabel(selectedRepository.value);
});

// Where the selection lands, e.g. `below "History of Pizza"`
const destination = computed(() => {
  const anchorName = props.anchor?.data?.name;
  if (!anchorName) return `into this ${currentRepositoryStore.schemaName}`;
  return `${props.action === AddInto ? 'into' : 'below'} "${anchorName}"`;
});

// Content can be linked from same-type repositories and from types that map
// to it (mapsTo), so name them all, with the current type first.
const sourceTypeNames = computed(() => {
  const schemaId = repository.value!.schema;
  const ids = $schemaService.getCompatibleSchemaIds(schemaId);
  const ordered = [schemaId, ...ids.filter((id: string) => id !== schemaId)];
  return ordered.map((id) => $schemaService.getSchema(id).name as string);
});

const sourceLabel = computed(() => {
  const names = sourceTypeNames.value;
  if (names.length > 2) return 'Select a source';
  return `Select a ${names.join(' or ')}`;
});

const sourcePlaceholder = computed(() => {
  const names = sourceTypeNames.value;
  if (names.length > 2) return 'Type to search...';
  return `Type to search ${names.map((it) => pluralize(it)).join(' or ')}...`;
});

// Get all outline activity types from the selected repository's schema
const supportedLevels = computed(() => {
  if (!selectedRepository.value) return [];
  const schemaId = selectedRepository.value.schema;
  const outlineLevels = $schemaService.getOutlineLevels(schemaId);
  return outlineLevels.map((level: any) => level.type);
});

const selectionSummary = computed(() =>
  describeSelection(selectedActivities.value.map((it) => activityLabel(it))),
);

const linkBtnLabel = computed(() => {
  const { count, countLabel } = selectionSummary.value;
  if (!count) return 'Link';
  return `Link ${countLabel}${props.action === AddInto ? ' inside' : ''}`;
});

const fetchRepositories = loader(async (search = '') => {
  const { items } = await api.repository.list({
    query: { search, compatibleWith: repository.value?.schema },
  });
  // Exclude current repository
  repositories.value = sortBy(
    items.filter((repo) => repo.id !== repository.value?.id),
    'name',
  );
}, 500);

const selectRepository = async (repo: Repository | null) => {
  if (!repo || !repositories.value.find(({ id }) => id === repo.id)) return;
  selectedRepository.value = repo;
  selectedActivities.value = [];
  isLoadingActivities.value = true;
  try {
    const activities = await api.activity.list({
      params: { repositoryId: repo.id },
      query: { outlineOnly: true },
    });
    repositoryActivities.value = sortBy(activities, 'position');
  } finally {
    isLoadingActivities.value = false;
  }
};

const linkActivity = async (
  activity: Activity,
  prevActivity?: Activity,
): Promise<Activity[]> => {
  const anchor = props.action === AddAfter && prevActivity
    ? prevActivity
    : props.anchor;
  const position = await activityStore.calculateCopyPosition(props.action, anchor);
  const parentId = anchor
    ? props.action === AddInto ? anchor.id : anchor.parentId
    : null;
  const linked = await api.activity.link({
    params: { repositoryId: repository.value!.id },
    body: { sourceId: activity.id, parentId, position },
  });
  linked.forEach((a) => activityStore.add(a));
  return linked;
};

const activityLabel = (item?: Activity) => {
  const source = repositoryActivities.value.find((it) => it.id === item?.id);
  return (source && $schemaService.getActivityLabel(source)) || 'Item';
};

const linkSelection = async () => {
  if (!selectedActivities.value.length) return;
  isLinking.value = true;
  const items = sortBy(selectedActivities.value, ['parentId', 'position']);
  const { noun, verb } = selectionSummary.value;
  try {
    let prevLinkedItem: Activity | undefined;
    let firstLinked: Activity | undefined;
    for (const item of items) {
      const linked = await linkActivity(item, prevLinkedItem);
      if (!firstLinked) firstLinked = linked[0];
      prevLinkedItem = linked[0];
    }
    notify(`${upperFirst(noun)} ${verb} been linked`);
    emit('completed', items);
    if (firstLinked) currentRepositoryStore.selectActivity(firstLinked.id);
    close();
  } catch {
    notify(`We couldn't link ${noun}`, { color: 'error' });
  } finally {
    isLinking.value = false;
  }
};

const close = () => {
  visible.value = false;
  emit('close');
};

onMounted(() => fetchRepositories());
</script>

<style lang="scss" scoped>
:deep(.v-list-item__content) {
  flex: initial;
}
</style>
