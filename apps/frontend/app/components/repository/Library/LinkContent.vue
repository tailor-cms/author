<template>
  <TailorDialog
    v-model="visible"
    header-icon="mdi-link-variant"
    width="650"
    persistent
  >
    <template v-if="showActivator" #activator="{ props: dialogProps }">
      <VBtn
        v-bind="dialogProps"
        class="px-1"
        color="primary-lighten-3"
        prepend-icon="mdi-link-variant"
        variant="text"
      >
        Link Existing
      </VBtn>
    </template>
    <template #header>Link existing content</template>
    <template #body>
      <VAutocomplete
        :items="repositories"
        :loading="isLoadingRepositories"
        :menu-props="{ maxWidth: '100%' }"
        :model-value="selectedRepository"
        item-title="name"
        item-value="id"
        label="Select a Repository"
        placeholder="Type to search repositories..."
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
        color="primary-darken-4"
        variant="text"
        @click="close"
      >
        Cancel
      </VBtn>
      <VBtn
        :disabled="!selectedActivities.length || isLinking"
        :loading="isLinking"
        class="ml-2"
        color="primary-darken-2"
        variant="tonal"
        @click="linkSelection"
      >
        {{ linkBtnLabel }}
      </VBtn>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { activity as activityApi, repository as repositoryApi } from '@/api';
import { storeToRefs } from 'pinia';
import { TailorDialog, useLoader } from '@tailor-cms/core-components';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { Repository } from '@tailor-cms/interfaces/repository';
import { InsertLocation } from '@tailor-cms/utils';
import pluralize from 'pluralize-esm';
import RepositoryTree from '../Outline/CopyActivity/RepositoryTree.vue';
import { sortBy } from 'lodash-es';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

const { AddAfter, AddInto } = InsertLocation;

interface Props {
  anchor?: Activity | null;
  action?: InsertLocation;
  showActivator?: boolean;
}

const emit = defineEmits(['close', 'completed']);
const props = withDefaults(defineProps<Props>(), {
  action: InsertLocation.AddAfter,
  anchor: null,
  showActivator: false,
});

const { $schemaService } = useNuxtApp() as any;
const currentRepositoryStore = useCurrentRepository();
const activityStore = useActivityStore();

const { loading: isLoadingRepositories, loader } = useLoader();
const { repository } = storeToRefs(currentRepositoryStore);

const visible = ref(!props.showActivator);
const repositories = ref<Repository[]>([]);
const selectedRepository = ref<Repository | null>(null);
const repositoryActivities = ref<Activity[]>([]);
const selectedActivities = ref<Activity[]>([]);
const isLoadingActivities = ref(false);
const isLinking = ref(false);

const schemaName = computed(() => {
  if (!selectedRepository.value) return '';
  return $schemaService.getSchema(selectedRepository.value.schema).name;
});

// Get all outline activity types from the selected repository's schema
const supportedLevels = computed(() => {
  if (!selectedRepository.value) return [];
  const schemaId = selectedRepository.value.schema;
  const outlineLevels = $schemaService.getOutlineLevels(schemaId);
  return outlineLevels.map((level: any) => level.type);
});

const linkBtnLabel = computed(() => {
  const count = selectedActivities.value.length;
  if (!count) return 'Link';
  const label = pluralize('item', count, true);
  return `Link ${label} ${props.action === AddInto ? 'inside' : ''}`;
});

const fetchRepositories = loader(async (search = '') => {
  const result = await repositoryApi.getRepositories({
    search,
    compatibleWith: repository.value?.schema,
  });
  // Exclude current repository
  repositories.value = sortBy(
    result.items.filter((repo: Repository) => repo.id !== repository.value?.id),
    'name',
  );
}, 500);

const selectRepository = async (repo: Repository | null) => {
  if (!repo || !repositories.value.find(({ id }) => id === repo.id)) return;
  selectedRepository.value = repo;
  selectedActivities.value = [];
  isLoadingActivities.value = true;
  try {
    const activities = await activityApi.getActivities(repo.id, {
      outlineOnly: true,
    });
    repositoryActivities.value = sortBy(activities, 'position');
  } finally {
    isLoadingActivities.value = false;
  }
};

const linkActivity = async (activity: Activity, prevActivity?: Activity) => {
  const { action } = props;
  const anchor = (action === AddAfter && prevActivity) || props.anchor;
  const position = await activityStore.calculateCopyPosition(action, anchor);
  const parentId = anchor
    ? action === AddInto
      ? anchor.id
      : anchor.parentId
    : null;
  const linked = await activityApi.link(repository.value!.id, {
    sourceId: activity.id,
    parentId,
    position,
  });
  // Add linked activities to store
  const linkedArray = Array.isArray(linked) ? linked : [linked];
  linkedArray.forEach((a: Activity) => activityStore.add(a));
  return linkedArray;
};

const linkSelection = async () => {
  if (!selectedActivities.value.length) return;
  isLinking.value = true;
  try {
    const items = sortBy(selectedActivities.value, ['parentId', 'position']);
    let prevLinkedItem: Activity | undefined;
    for (const item of items) {
      const linked = await linkActivity(item, prevLinkedItem);
      prevLinkedItem = linked[0];
    }
    emit('completed', items);
    close();
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
