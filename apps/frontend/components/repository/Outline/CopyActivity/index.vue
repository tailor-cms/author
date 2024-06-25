<template>
  <TailorDialog
    v-model="visible"
    header-icon="mdi-content-copy"
    width="650"
    persistent
  >
    <template v-if="showActivator" #activator="{ props: dialogProps }">
      <VBtn
        v-bind="dialogProps"
        class="px-1"
        color="grey darken-3"
        prepend-icon="mdi-content-copy"
        variant="text"
      >
        Copy
      </VBtn>
    </template>
    <template v-if="schema" #header>
      Copy items from {{ pluralize(schema.name) }}
    </template>
    <template v-if="schema" #body>
      <div v-if="isCopyingActivities" class="ma-4">
        <div class="text-subtitle-1 text-center mb-2">
          Copying {{ selectedActivities.length }} items...
        </div>
        <VProgressLinear color="primary-darken-2" indeterminate />
      </div>
      <VAutocomplete
        :items="repositories"
        :label="schema.name"
        :loading="isFetchingRepositories"
        :model-value="selectedRepository"
        item-title="name"
        item-value="id"
        placeholder="Type to search repositories..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        return-object
        @update:model-value="selectRepository"
        @update:search="fetchRepositories"
      />
      <RepositoryTree
        v-if="selectedRepository && !isFetchingActivities"
        :activities="selectedRepository.activities || []"
        :schema-name="schema.name"
        :supported-levels="levels"
        @change="selectedActivities = $event"
      />
    </template>
    <template #actions>
      <VBtn
        :disabled="isCopyingActivities"
        color="primary-darken-4"
        variant="text"
        @click="close"
      >
        Cancel
      </VBtn>
      <VBtn
        :disabled="!selectedActivities.length || isCopyingActivities"
        class="ml-2"
        color="primary-darken-2"
        variant="tonal"
        @click="copySelection"
      >
        {{ copyBtnLabel }}
      </VBtn>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { InsertLocation } from '@tailor-cms/utils';
import pluralize from 'pluralize';
import { SCHEMAS } from 'tailor-config-shared';
import sortBy from 'lodash/sortBy';
import { useLoader } from '@tailor-cms/core-components-next';

import { activity as activityApi, repository as repositoryApi } from '@/api';
import type { Activity } from '@/api/interfaces/activity';
import type { Repository } from '@/api/interfaces/repository';
import RepositoryTree from './RepositoryTree.vue';
import TailorDialog from '@/components/common/TailorDialog.vue';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

const { ADD_AFTER, ADD_INTO } = InsertLocation;

interface Props {
  repositoryId: number;
  levels: string[];
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
const isFetchingActivities = ref(false);
const isCopyingActivities = ref(false);

const schema = computed(() =>
  SCHEMAS.find((it) => store.repository?.schema === it.id),
);

const copyBtnLabel = computed(() => {
  const selectedCount = selectedActivities.value.length;
  const selectionLabel = selectedCount
    ? `${pluralize('item', selectedCount, true)}`
    : '';
  return `Copy ${selectionLabel} ${props.action === ADD_INTO ? 'inside' : ''}`;
});

const selectRepository = async (repository: Repository) => {
  if (!repositories.value.find(({ id }) => id === repository?.id)) return;
  selectedRepository.value = repository;
  selectedActivities.value = [];
  if (repository.activities) return;
  isFetchingActivities.value = true;
  const activities = await activityApi.getActivities(repository.id);
  repository.activities = sortBy(activities, 'position');
  isFetchingActivities.value = false;
};

const copyActivity = async (activity: Activity, prevActivity?: Activity) => {
  const { action, repositoryId } = props;
  const { id: srcId, repositoryId: srcRepositoryId, type } = activity;
  const anchor = (action === ADD_AFTER && prevActivity) || props.anchor;
  return activityStore.clone({
    srcId,
    srcRepositoryId,
    repositoryId,
    type,
    position: await activityStore.calculateCopyPosition(action, anchor),
    ...(anchor && {
      parentId: action === ADD_INTO ? anchor.id : anchor.parentId,
    }),
  });
};

const copySelection = async () => {
  isCopyingActivities.value = true;
  const items = sortBy(selectedActivities.value, ['parentId', 'position']);
  let prevOutlineItem: Activity | undefined;
  for (const item of items) {
    const copied = await copyActivity(item, prevOutlineItem);
    prevOutlineItem = copied[0]; // Only first copied activity is outline item
  }
  emit('completed', items[0].parentId);
  isCopyingActivities.value = false;
  close();
};

const close = () => {
  visible.value = false;
  emit('close');
};

const fetchRepositories = loader(async (search = '') => {
  const params = { search, schema: store.repository?.schema };
  const repositoriesData = await repositoryApi.getRepositories(params);
  repositories.value = sortBy(repositoriesData.items, 'name');
}, 500);

onMounted(() => fetchRepositories());
</script>

<style lang="scss" scoped>
:deep(.v-list-item__content) {
  flex: initial;
}
</style>
