<template>
  <VDataTable
    :headers="headers"
    :items="activities"
    :items-per-page="25"
    :sort-by="[{ key: 'createdAt', order: 'desc' }]"
    :row-props="getRowProps"
    class="collection-table bg-primary-darken-2 rounded-lg text-left"
    item-value="id"
    fixed-header
    @click:row="selectRow"
  >
    <template #[`item.data.name`]="{ item }">
      {{ item.data.name }}
    </template>
    <template #[`item.createdAt`]="{ item }">
      {{ formatDate(item.createdAt, 'MM/dd/yy HH:mm') }}
    </template>
    <template #[`item.updatedAt`]="{ item }">
      {{ formatDate(item.updatedAt, 'MM/dd/yy HH:mm') }}
    </template>
    <template #[`item.actions`]="{ item }">
      <VChip v-if="isSoftDeleted(item)" size="small">
        <span class="mr-1 font-weight-bold">Deleted:</span>
        Publish required
        <VIcon
          v-tooltip:bottom="'Will be removed upon publishing'"
          class="ml-2"
          icon="mdi-information-outline"
        />
      </VChip>
      <template v-else>
        <VBtn
          v-tooltip:bottom="'Open'"
          class="mr-2"
          color="teal-lighten-4"
          prepend-icon="mdi-page-next-outline"
          size="small"
          variant="tonal"
          text="Open"
          @click.stop="openActivity(item)"
        />
        <VBtn
          v-tooltip:bottom="'Delete'"
          color="secondary-lighten-3"
          density="comfortable"
          icon="mdi-trash-can-outline"
          size="small"
          variant="text"
          @click.stop="deleteActivity(item)"
        />
      </template>
    </template>
    <template #no-data>
      <VAlert
        class="my-4"
        color="primary-lighten-3"
        icon="mdi-magnify"
        variant="tonal"
        prominent
      >
        No matches found!
      </VAlert>
    </template>
  </VDataTable>
</template>

<script lang="ts" setup>
import { activity as activityUtils } from '@tailor-cms/utils';
import { formatDate } from 'date-fns/format';
import { first, sortBy } from 'lodash-es';

import type { StoreActivity } from '@/stores/activity';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';

defineProps<{
  activities: StoreActivity[];
}>();

const repositoryStore = useCurrentRepository();
const activityStore = useActivityStore();
const showConfirmationDialog = useConfirmationDialog();

const headers = [
  { title: 'Name', value: 'data.name', sortable: true },
  { title: 'Date Created', value: 'createdAt', sortable: true, width: '10rem' },
  { value: 'actions', sortable: false, align: 'end' as const, width: '10rem' },
];

const { doesRequirePublishing } = activityUtils;

const isSoftDeleted = (activity: StoreActivity) =>
  doesRequirePublishing(activity);

const getRowProps = ({ item }: { item: StoreActivity }) => {
  const classes = [];
  if (isSoftDeleted(item)) classes.push('soft-deleted');
  if (repositoryStore.selectedActivity?.id === item.id) classes.push('selected');
  return { class: classes.join(' ') };
};

const selectRow = (_event: Event, { item }: any) => {
  repositoryStore.selectActivity(item.id);
};

const openActivity = (activity: StoreActivity) => {
  const { id: activityId, repositoryId } = activity;
  navigateTo({ name: 'editor', params: { id: repositoryId, activityId } });
};

const deleteActivity = (activity: StoreActivity) =>
  showConfirmationDialog({
    title: 'Delete item?',
    message: `Are you sure you want to delete ${activity.data.name}?`,
    action: () => {
      activityStore.remove(activity.id);
      const focusNode = first(sortBy(repositoryStore.rootActivities, 'position'));
      if (focusNode) repositoryStore.selectActivity(focusNode.id);
    },
  });
</script>

<style lang="scss" scoped>
.collection-table {
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.v-table__wrapper) {
    flex: 1 1 auto;
  }

  line-height: 1.25;

  :deep(td) {
    padding: 0.5rem 1rem !important;
  }

  :deep(tbody) tr {
    transition: background-color 0.3s ease;

    &.soft-deleted {
      background: rgba(var(--v-theme-secondary-darken-1), 0.1) !important;

      &.selected,
      &:hover {
        background: rgba(var(--v-theme-secondary-lighten-2), 0.2) !important;
      }
    }

    &.selected,
    &:hover {
      background: rgba(var(--v-theme-primary-darken-1)) !important;
    }
  }

  :deep(th) {
    background: rgba(var(--v-theme-primary-darken-2)) !important;
    color: white !important;

    &:hover {
      font-weight: bold;
    }
  }
}
</style>
