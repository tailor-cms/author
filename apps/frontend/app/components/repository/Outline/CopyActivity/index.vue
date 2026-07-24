<template>
  <TailorDialog
    v-model="visible"
    header-icon="mdi-content-copy"
    title="Copy existing content"
    width="650"
    persistent
  >
    <template #body>
      <div v-if="isCopyingActivities" class="ma-4">
        <div class="text-body-large text-center mb-2">
          Copying {{ selectionSummary.countLabel }}...
        </div>
        <VProgressLinear color="primary" indeterminate />
      </div>
      <p class="text-body-medium text-medium-emphasis mb-5">
        The selected content will be copied {{ destination }}.
      </p>
      <VAutocomplete
        :items="repositories"
        :label="`Select a ${store.schemaName}`"
        :loading="isFetchingRepositories"
        :menu-props="{ maxWidth: '100%' }"
        :model-value="selectedRepository"
        :placeholder="`Type to search ${pluralize(store.schemaName)}...`"
        item-title="name"
        item-value="id"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        return-object
        @update:model-value="selectRepository"
        @update:search="fetchRepositories"
      />
      <RepositoryTree
        v-if="selectedRepository && !isFetchingActivities"
        :activities="selectedRepository.activities || []"
        :schema-name="store.schemaName"
        :supported-levels="levels"
        @change="selectedActivities = $event"
      />
    </template>
    <template #actions>
      <VBtn
        :disabled="isCopyingActivities"
        text="Cancel"
        variant="text"
        @click="close"
      />
      <VBtn
        :disabled="!selectedActivities.length || isCopyingActivities"
        :text="copyBtnLabel"
        color="primary"
        variant="flat"
        @click="copySelection"
      />
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { Repository } from '@tailor-cms/interfaces/repository';

import { sortBy, upperFirst } from 'lodash-es';
import { TailorDialog, useLoader } from '@tailor-cms/core-components';
import { InsertLocation } from '@tailor-cms/utils';
import { schema as schemaApi } from '@tailor-cms/config';
import pluralize from 'pluralize-esm';

import { api } from '@/api';
import { describeSelection } from '@/utils/describeSelection';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';
import RepositoryTree from './RepositoryTree.vue';

const { AddAfter, AddInto } = InsertLocation;

interface Props {
  repositoryId: number;
  levels: string[];
  action: InsertLocation;
  anchor?: Activity | null;
}

const props = withDefaults(defineProps<Props>(), {
  anchor: null,
});

const emit = defineEmits(['close', 'completed']);

const notify = useNotification();

const store = useCurrentRepository();
const activityStore = useActivityStore();
const { loading: isFetchingRepositories, loader } = useLoader();

const visible = ref(true);
const repositories = ref<Repository[]>([]);
const selectedRepository = ref<Repository | null>(null);
const selectedActivities = ref<Activity[]>([]);
const isFetchingActivities = ref(false);
const isCopyingActivities = ref(false);

// Where the selection lands, e.g. `below "History of Pizza"`
const destination = computed(() => {
  const anchorName = props.anchor?.data?.name;
  if (!anchorName) return `into this ${store.schemaName}`;
  return `${props.action === AddInto ? 'into' : 'below'} "${anchorName}"`;
});

const selectionSummary = computed(() =>
  describeSelection(selectedActivities.value.map((it) => activityLabel(it))),
);

const copyBtnLabel = computed(() => {
  const { count, countLabel } = selectionSummary.value;
  if (!count) return 'Copy';
  return `Copy ${countLabel}${props.action === AddInto ? ' inside' : ''}`;
});

const selectRepository = async (repository: Repository) => {
  if (!repositories.value.find(({ id }) => id === repository?.id)) return;
  selectedRepository.value = repository;
  selectedActivities.value = [];
  if (repository.activities) return;
  isFetchingActivities.value = true;
  const activities = await api.activity.list({
    params: { repositoryId: repository.id },
  });
  repository.activities = sortBy(activities, 'position');
  isFetchingActivities.value = false;
};

const copyActivity = async (activity: Activity, prevActivity?: Activity) => {
  const { action, repositoryId } = props;
  const { id: srcId, repositoryId: srcRepositoryId } = activity;
  const anchor = (action === AddAfter && prevActivity) || props.anchor;
  return activityStore.clone({
    srcId,
    srcRepositoryId,
    repositoryId,
    position: await activityStore.calculateCopyPosition(action, anchor),
    ...(anchor && {
      parentId: action === AddInto ? anchor.id : anchor.parentId,
    }),
  });
};

const activityLabel = (item?: Activity) => {
  const source = selectedRepository.value?.activities?.find(
    (it) => it.id === item?.id,
  );
  return (source && schemaApi.getActivityLabel(source)) || 'Item';
};

const copySelection = async () => {
  isCopyingActivities.value = true;
  const items = sortBy(selectedActivities.value, ['parentId', 'position']);
  const { noun, verb } = selectionSummary.value;
  try {
    let prevOutlineItem: Activity | undefined;
    for (const item of items) {
      const copied = await copyActivity(item, prevOutlineItem);
      prevOutlineItem = copied[0]; // Only first copied activity is outline item
    }
    notify(`${upperFirst(noun)} ${verb} been copied`);
    emit('completed', items[0]?.parentId);
    close();
  } catch {
    notify(`We couldn't copy ${noun}`, { color: 'error' });
  } finally {
    isCopyingActivities.value = false;
  }
};

const close = () => {
  visible.value = false;
  emit('close');
};

const fetchRepositories = loader(async (search = '') => {
  const { items } = await api.repository.list({
    query: {
      search,
      ...(store.repository?.schema ? { schemas: [store.repository.schema] } : {}),
    },
  });
  repositories.value = sortBy(items, 'name');
}, 500);

onMounted(() => fetchRepositories());
</script>

<style lang="scss" scoped>
:deep(.v-list-item__content) {
  flex: initial;
}
</style>
