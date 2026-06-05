<template>
  <VListItem
    ref="rowEl"
    :class="{ 'is-selected': isSelected, 'is-deleted': isSoftDeleted }"
    :ripple="false"
    :style="{ '--row-accent': config?.color }"
    class="collection-row py-2 px-4 mb-2"
    rounded
    @click="selectRow"
  >
    <VListItemTitle class="collection-title font-weight-medium">
      {{ activity.data.name }}
    </VListItemTitle>
    <VListItemSubtitle class="collection-meta text-body-small">
      <span v-tooltip:bottom="formatDate(activity.createdAt, 'MMM d, yyyy HH:mm')">
        {{ formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }) }}
      </span>
    </VListItemSubtitle>
    <template #append>
      <VChip v-if="isSoftDeleted" size="small">
        <span class="pr-1 font-weight-bold">Deleted:</span>
        Publish required
        <VIcon
          v-tooltip:bottom="'Will be removed upon publishing'"
          class="ml-2"
          color="error"
          icon="mdi-information-outline"
        />
      </VChip>
      <div v-else class="row-actions d-flex align-center">
        <VBtn
          v-tooltip:bottom="'Open'"
          class="text-medium-emphasis mr-1"
          icon="mdi-page-next-outline"
          rounded="pill"
          size="small"
          aria-label="Open"
          variant="text"
          @click.stop="openActivity"
        />
        <VBtn
          v-tooltip:bottom="'Delete'"
          aria-label="Delete item"
          class="delete-btn text-medium-emphasis"
          icon="mdi-trash-can-outline"
          size="small"
          variant="text"
          @click.stop="deleteActivity"
        />
      </div>
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import { activity as activityUtils } from '@tailor-cms/utils';
import { formatDate } from 'date-fns/format';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { first, sortBy } from 'lodash-es';
import { storeToRefs } from 'pinia';

import type { StoreActivity } from '@/stores/activity';
import { useActivityStore } from '@/stores/activity';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{ activity: StoreActivity }>();

const repositoryStore = useCurrentRepository();
const { selectedActivity, taxonomy } = storeToRefs(repositoryStore);
const activityStore = useActivityStore();
const showConfirmationDialog = useConfirmationDialog();

const config = computed(() =>
  taxonomy.value?.find((it: any) => it.type === props.activity.type),
);

const isSelected = computed(
  () => selectedActivity.value?.id === props.activity.id,
);

const isSoftDeleted = computed(() =>
  activityUtils.doesRequirePublishing(props.activity),
);

const rowEl = ref<{ $el: HTMLElement } | null>(null);

const isOffscreen = (el: HTMLElement) => {
  const { top, bottom } = el.getBoundingClientRect();
  return top < 0 || bottom > window.innerHeight;
};

const scrollIntoView = async (behavior: ScrollBehavior) => {
  await nextTick();
  const el = rowEl.value?.$el;
  if (el && isOffscreen(el)) el.scrollIntoView({ behavior, block: 'center' });
};

const selectRow = () => repositoryStore.selectActivity(props.activity.id);

const openActivity = () => {
  const { id: activityId, repositoryId } = props.activity;
  navigateTo({ name: 'editor', params: { id: repositoryId, activityId } });
};

const deleteActivity = () =>
  showConfirmationDialog({
    title: 'Delete item?',
    color: 'error',
    message: `Are you sure you want to delete ${props.activity.data.name}?`,
    action: () => {
      activityStore.remove(props.activity.id);
      const focusNode = first(sortBy(repositoryStore.rootActivities, 'position'));
      if (focusNode) repositoryStore.selectActivity(focusNode.id);
    },
  });

onMounted(() => {
  if (isSelected.value) scrollIntoView('auto');
});

watch(isSelected, (selected) => {
  if (selected) scrollIntoView('smooth');
});
</script>

<style lang="scss" scoped>
.collection-row {
  background-color: rgba(var(--v-theme-surface-container));
  border-left: 8px solid var(--row-accent);
  transition:
    background-color 0.2s cubic-bezier(0.25, 0.8, 0.25, 1),
    border-left-width 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);

  .collection-meta {
    opacity: 0.65;
  }

  &:hover {
    background-color: rgb(var(--v-theme-surface-container-high));
  }

  &.is-selected {
    background-color: rgb(var(--v-theme-surface-container-high));
    border-left-width: 2.25rem;

    .collection-title {
      font-weight: 600 !important;
    }
  }

  &.is-deleted {
    background-color: rgba(var(--v-theme-error), 0.15);
    border-left-color: rgb(var(--v-theme-error));

    &:hover,
    &.is-selected {
      background-color: rgba(var(--v-theme-error), 0.2);
    }
  }

  .row-actions {
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover .row-actions,
  &:focus-within .row-actions,
  &.is-selected .row-actions {
    opacity: 1;
  }
}
</style>
