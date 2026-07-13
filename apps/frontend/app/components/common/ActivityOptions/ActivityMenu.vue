<template>
  <span>
    <VMenu
      v-model="isOpen"
      content-class="activity-menu"
      location="left"
      offset="-40"
      width="240"
    >
      <template #activator="{ props: menuProps }">
        <VBtn
          v-bind="menuProps"
          aria-label="Options menu"
          icon="mdi-dots-vertical"
          variant="text"
          :density="density"
          :size="activatorSize"
          :rounded="rounded"
        />
      </template>
      <VList density="compact" nav>
        <VListItem
          v-for="it in menuOptions"
          :key="it.name"
          :aria-label="it.name"
          :prepend-icon="it.icon"
          :title="it.name"
          :base-color="it.color"
          @click="it.action"
        />
      </VList>
    </VMenu>
    <CreateDialog
      v-if="showCreateDialog"
      :action="action"
      :anchor="activity"
      :heading="`${selectedActivity?.getAddDialogHeading(action)}: ${activityName}`"
      :repository-id="activity.repositoryId"
      :visible="showCreateDialog"
      @close="showCreateDialog = false"
    />
    <CopyDialog
      v-if="showCopyDialog"
      :action="action"
      :anchor="activity"
      :levels="supportedLevels"
      :repository-id="activity.repositoryId"
      @close="showCopyDialog = false"
    />
    <LinkContent
      v-if="showLinkDialog"
      :action="action"
      :anchor="activity"
      @close="showLinkDialog = false"
      @completed="showLinkDialog = false"
    />
  </span>
</template>

<script lang="ts" setup>
import type { ActivityConfig } from '@tailor-cms/interfaces/schema';
import type { StoreActivity } from '@/stores/activity';

import { sortBy } from 'lodash-es';
import { InsertLocation } from '@tailor-cms/utils';
import { schema as schemaApi } from '@tailor-cms/config';
import pluralize from 'pluralize-esm';

import CopyDialog from '@/components/repository/Outline/CopyActivity/index.vue';
import CreateDialog from '@/components/repository/Outline/CreateDialog/index.vue';
import LinkContent from '@/components/repository/Library/LinkContent.vue';
import { useCurrentRepository } from '@/stores/current-repository';
import { useSelectedActivity } from '#imports';

const { AddAfter, AddBefore, AddInto } = InsertLocation;
const activityStore = useActivityStore();
const currentRepositoryStore = useCurrentRepository();
const { requestDeletion } = useCollectionItemDeletion();

const confirmationDialog = useConfirmationDialog();
const notify = useNotification();

export interface Props {
  activity: StoreActivity;
  activatorSize?: string;
  rounded?: boolean | string;
  density?: 'default' | 'comfortable' | 'compact';
}

const props = withDefaults(defineProps<Props>(), {
  activatorSize: 'small',
  rounded: 'circle',
});

const { $pluginRegistry } = useNuxtApp() as any;
const selectedActivity = useSelectedActivity(props.activity);

const isOpen = defineModel<boolean>({ default: false });

// Get processed name via plugin hooks
const activityName = computed(() => {
  const data = props.activity?.data;
  if (!data) return '';
  const rawValue = data.name ?? '';
  return $pluginRegistry.filter('data:value', rawValue, { data, key: 'name' });
});

const showCreateDialog = ref(false);
const showCopyDialog = ref(false);
const showLinkDialog = ref(false);
const action = ref<InsertLocation>(AddAfter);
const supportedLevels = ref<string[]>([]);

const addMenuOptions = computed(() => {
  const items = [
    {
      name: 'Add item above',
      icon: 'add:above',
      action: () => setCreateContext(AddBefore),
    },
    {
      name: 'Add item below',
      icon: 'add:below',
      action: () => setCreateContext(AddAfter),
    },
  ];
  if (!selectedActivity.subLevels.value?.length) return items;
  return items.concat({
    name: 'Add item into',
    icon: 'add:into',
    action: () => setCreateContext(AddInto),
  });
});

const copyMenuOptions = computed(() => {
  const items = [
    {
      name: 'Copy existing below',
      icon: 'mdi-content-copy',
      action: () => setCopyContext(selectedActivity.sameLevel.value, AddAfter),
    },
  ];
  if (!selectedActivity.subLevels.value.length) return items;
  return items.concat({
    name: 'Copy existing into',
    icon: 'mdi-content-copy',
    action: () => setCopyContext(selectedActivity.subLevels.value, AddInto),
  });
});

const linkMenuOptions = computed(() => {
  const items = [
    {
      name: 'Link content below',
      icon: 'mdi-link-variant',
      action: () => setLinkContext(AddAfter),
    },
  ];
  if (!selectedActivity.subLevels.value.length) return items;
  return items.concat({
    name: 'Link content into',
    icon: 'mdi-link-variant',
    action: () => setLinkContext(AddInto),
  });
});

const menuOptions = computed(() => {
  return [
    ...addMenuOptions.value,
    ...copyMenuOptions.value,
    ...linkMenuOptions.value,
    {
      name: 'Remove',
      icon: 'mdi-trash-can-outline',
      color: 'error',
      action: () => deleteActivity(),
    },
  ];
});

const setCreateContext = (actionValue: InsertLocation) => {
  action.value = actionValue;
  showCreateDialog.value = true;
};

const setCopyContext = (levels: ActivityConfig[], actionValue: InsertLocation) => {
  supportedLevels.value = levels.map((it) => it.type);
  action.value = actionValue;
  showCopyDialog.value = true;
};

const setLinkContext = (actionValue: InsertLocation) => {
  action.value = actionValue;
  showLinkDialog.value = true;
};

const focusNearestActivity = () => {
  const { activity } = props;
  const roots = sortBy(currentRepositoryStore.rootActivities, 'position');
  const focusNode = activity.parentId
    ? activityStore.findById(activity.parentId)
    : roots.find((it) => it.id !== activity.id);
  if (focusNode) return currentRepositoryStore.selectActivity(focusNode.id);
  currentRepositoryStore.deselectActivity();
};

const deleteActivity = () => {
  const { activity } = props;
  // Collection records go through the reference-aware deletion flow
  if (currentRepositoryStore.isCollection) {
    return requestDeletion(activity, focusNearestActivity);
  }
  // Singularized - shared with grammar of other type-aware messages
  const label = pluralize.singular(
    schemaApi.getActivityLabel(activity) || 'item',
  );
  confirmationDialog({
    title: `Delete ${label}?`,
    color: 'error',
    message:
      `Are you sure you want to delete the ${label} "${activityName.value}"?`,
    action: async () => {
      try {
        await activityStore.remove(activity.id);
        notify(`The ${label} has been deleted`, { immediate: true });
        focusNearestActivity();
      } catch {
        notify(`We couldn't delete the ${label}`, { color: 'error' });
      }
    },
  });
};
</script>
