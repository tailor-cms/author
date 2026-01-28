<template>
  <div>
    <VMenu location="left" offset="-40" width="240" contained>
      <template #activator="{ props: menuProps }">
        <VBtn
          v-bind="menuProps"
          aria-label="Options menu"
          color="primary-lighten-3"
          icon="mdi-dots-vertical"
          size="small"
          variant="text"
          rounded
        >
        </VBtn>
      </template>
      <VList class="text-left text-uppercase">
        <VListItem
          v-for="it in menuOptions"
          :key="it.name"
          :aria-label="it.name"
          dense
          @click="it.action()"
        >
          <VListItemTitle>
            <VIcon class="pr-1" size="20">{{ it.icon }}</VIcon>
            {{ it.name }}
          </VListItemTitle>
        </VListItem>
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
      :action="linkAction"
      :anchor="activity"
      @close="showLinkDialog = false"
      @completed="showLinkDialog = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { first, sortBy } from 'lodash-es';
import type { Activity } from '@tailor-cms/interfaces/activity';
import { InsertLocation } from '@tailor-cms/utils';

import CopyDialog from '@/components/repository/Outline/CopyActivity/index.vue';
import CreateDialog from '@/components/repository/Outline/CreateDialog/index.vue';
import LinkContent from '@/components/repository/Library/LinkContent.vue';
import { useCurrentRepository } from '@/stores/current-repository';
import { useSelectedActivity } from '#imports';

const { AddAfter, AddBefore, AddInto } = InsertLocation;
const activityStore = useActivityStore();
const currentRepositoryStore = useCurrentRepository();

const props = defineProps<{ activity: StoreActivity }>();

const { $eventBus, $pluginRegistry } = useNuxtApp() as any;
const selectedActivity = useSelectedActivity(props.activity);

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
const linkAction = ref<InsertLocation>(AddAfter);

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
      icon: 'mdi-delete',
      action: () => deleteActivity(),
    },
  ];
});

const setCreateContext = (actionValue: InsertLocation) => {
  action.value = actionValue;
  showCreateDialog.value = true;
};

const setCopyContext = (levels: Activity[], actionValue: InsertLocation) => {
  supportedLevels.value = levels.map((it) => it.type);
  action.value = actionValue;
  showCopyDialog.value = true;
};

const setLinkContext = (actionValue: InsertLocation) => {
  linkAction.value = actionValue;
  showLinkDialog.value = true;
};

const deleteActivity = () => {
  const { activity } = props;
  const actionFunc = () => {
    const focusNode = activity.parentId
      ? activityStore.findById(activity.parentId)
      : first(sortBy(currentRepositoryStore.rootActivities, 'position'));
    activityStore.remove(props.activity.id);
    if (focusNode) currentRepositoryStore.selectActivity(focusNode.id);
  };
  $eventBus.channel('app').emit('showConfirmationModal', {
    title: 'Delete item?',
    message: `Are you sure you want to delete ${activityName.value}?`,
    action: actionFunc,
  });
};
</script>
