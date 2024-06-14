<template>
  <TailorDialog
    v-model="visible"
    header-icon="mdi-content-copy"
    width="650"
    persistent>
    <template v-if="showActivator" #activator="{ props: dialogProps }">
      <VBtn v-on="dialogProps" color="grey darken-3" variant="text" class="px-1">
        <VIcon class="pr-1">mdi-content-copy</VIcon>Copy
      </VBtn>
    </template>
    <template #header>
      Copy items from {{ pluralize(schema.name) }}
    </template>
    <template #body>
      <div v-if="isCopyingActivities" class="ma-4">
        <div class="text-subtitle-1 text-center mb-2">
          Copying {{ selectedActivities.length }} items...
        </div>
        <v-progress-linear color="primary-darken-2" indeterminate />
      </div>
      <VAutocomplete
        :items="repositories"
        :loading="isFetchingRepositories"
        :model-value="selectedRepository"
        :label="schema.name"
        item-title="name"
        item-value="id"
        prepend-inner-icon="mdi-magnify"
        placeholder="Type to search repositories..."
        variant="outlined"
        return-object
        @update:model-value="selectRepository"
        @update:search="fetchRepositories"
      />
      <RepositoryTree
        v-if="selectedRepository && !isFetchingActivities"
        @change="selectedActivities = $event"
        :schema-name="schema.name"
        :supported-levels="levels"
        :activities="selectedRepository.activities || []" />
    </template>
    <template #actions>
      <VBtn @click="close" :disabled="isCopyingActivities" variant="text">
        Cancel
      </VBtn>
      <VBtn
        @click="copySelection"
        :disabled="!selectedActivities.length || isCopyingActivities"
        color="secondary"
        variant="text"
        class="mr-1">
        {{ copyBtnLabel }}
      </VBtn>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
import { debounce } from 'lodash';
import RepositoryTree from './RepositoryTree.vue';
import { SCHEMAS } from 'tailor-config-shared';
import last from 'lodash/last';
import find from 'lodash/find';
import sortBy from 'lodash/sortBy';
import { useLoader } from '@tailor-cms/core-components-next';
import pluralize from 'pluralize';
import Promise from 'bluebird';

import { InsertLocation } from '@tailor-cms/utils';
import { activity as activityApi, repository as repositoryApi } from '@/api';
import type { Activity } from '@/api/interfaces/activity';
import type { Repository } from '@/api/interfaces/repository';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';
import TailorDialog from '@/components/common/TailorDialog.vue';

interface Props {
  repositoryId: number;
  levels: Array<number>;
  action: string;
  anchor?: Activity | null;
  showActivator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  anchor: null,
  showActivator: false,
});
const emit = defineEmits(['close', 'completed']);

const store = useCurrentRepository();
const activityStore = useActivityStore();
const { loading: isFetchingRepositories, loader } = useLoader();

const visible = ref(!props.showActivator);
const repositories = ref<Repository[]>([]);
const selectedRepository = ref<Repository | null>(null);
const selectedActivities = ref<Activity[]>([]);
const copiedActivities = ref<Activity[]>([]);
const isFetchingActivities = ref(false);
const isCopyingActivities = ref(false);

const schema = computed(() => SCHEMAS.find(it => store.repository.schema === it.id));
const copyBtnLabel = computed(() => {
  const selectedCount = selectedActivities.value.length;
  const selectionLabel = selectedCount ? `${pluralize('item', selectedCount, true)}` : '';
  return `Copy ${selectionLabel} ${props.action === InsertLocation.ADD_INTO ? 'inside' : ''}`;
});

const selectRepository = async (repository: Repository) => {
  if (!repositories.value.find(({ id }) => id === repository.id)) return;
  selectedRepository.value = repository;
  selectedActivities.value = [];
  if (repository.activities) return;
  isFetchingActivities.value = true;
  const activities = await activityApi.getActivities(repository.id);
  repository.activities = sortBy(activities, 'position');
  isFetchingActivities.value = false;
};

const copyActivity = async (activity: Activity) => {
  const { id: srcId, repositoryId: srcRepositoryId, type } = activity;
  const { action } = props;
  const anchor = (action === InsertLocation.ADD_AFTER && last(copiedActivities.value)) || props.anchor;
  const payload = {
    srcId,
    srcRepositoryId,
    repositoryId: props.repositoryId,
    type,
    position: await activityStore.calculateCopyPosition(action, anchor as Activity),
  } as any;
  if (anchor) {
    payload.parentId = action === InsertLocation.ADD_INTO ? anchor.id : anchor.parentId;
  }
  const activities = await activityStore.clone(payload);
  copiedActivities.value.push(activities[0]);
  return activities;
};

const copySelection = async () => {
  isCopyingActivities.value = true;
  const items = sortBy(selectedActivities.value, ['parentId', 'position']);
  await Promise.each(items, (it: Activity) => copyActivity(it));
  emit('completed', items[0].parentId);
  isCopyingActivities.value = false;
  copiedActivities.value = [];
  close();
};

const close = () => {
  visible.value = false;
  emit('close');
};

const fetchRepositories = debounce(loader(async (search = '') => {
  const params = { search, schema: store.repository.schema };
  const repositoriesData = await repositoryApi.getRepositories(params);
  repositories.value = sortBy(repositoriesData.items, 'name');
}), 500);

onMounted(() => {
  fetchRepositories();
});
</script>

<style lang="scss" scoped>
::v-deep .v-list-item__content {
  flex: initial;
}
</style>
