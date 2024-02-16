<template>
  <div>
    <VMenu max-width="350" offset="10">
      <template #activator="{ props: menuProps }">
        <VBtn
          v-bind="menuProps"
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
      :heading="`${selectedActivity?.getAddDialogHeading(action)}: ${
        activity.data.name
      }`"
      :repository-id="activity.repositoryId"
      :visible="showCreateDialog"
      @close="showCreateDialog = false"
    />
  </div>
</template>

<script lang="ts" setup>
import first from 'lodash/first';
import sortBy from 'lodash/sortBy';

import CreateDialog from '@/components/repository/CreateDialog/index.vue';
import InsertLocation from '@/lib/InsertLocation';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';
import { useSelectedActivity } from '#imports';

const { ADD_AFTER, ADD_BEFORE, ADD_INTO } = InsertLocation;
const activityStore = useActivityStore();
const currentRepositoryStore = useCurrentRepository();

const props = defineProps({
  activity: { type: Object, required: true },
});

const { $eventBus } = useNuxtApp() as any;
const selectedActivity = useSelectedActivity(props.activity);

const showCreateDialog = ref(false);
const showCopyDialog = ref(false);
const action = ref('');
const supportedLevels = ref<any[]>([]);

const addMenuOptions = computed(() => {
  const items = [
    {
      name: 'Add item above',
      icon: 'add:above',
      action: () => setCreateContext(ADD_BEFORE),
    },
    {
      name: 'Add item below',
      icon: 'add:below',
      action: () => setCreateContext(ADD_AFTER),
    },
  ];
  if (!selectedActivity.subLevels.value?.length) return items;
  return items.concat({
    name: 'Add item into',
    icon: 'add:into',
    action: () => setCreateContext(ADD_INTO),
  });
});

const copyMenuOptions = computed(() => {
  const items = [
    {
      name: 'Copy existing below',
      icon: 'mdi-content-copy',
      action: () => setCopyContext(selectedActivity.sameLevel.value, ADD_AFTER),
    },
  ];
  if (!selectedActivity.subLevels.value.length) return items;
  return items.concat({
    name: 'Copy existing into',
    icon: 'mdi-content-copy',
    action: () => setCopyContext(selectedActivity.subLevels.value, ADD_INTO),
  });
});

const menuOptions = computed(() => {
  return [
    ...addMenuOptions.value,
    ...copyMenuOptions.value,
    {
      name: 'Remove',
      icon: 'mdi-delete',
      action: () => deleteActivity(),
    },
  ];
});

const setCreateContext = (actionValue: string) => {
  action.value = actionValue;
  showCreateDialog.value = true;
};

const setCopyContext = (levels: any[], actionValue: string) => {
  supportedLevels.value = levels;
  action.value = actionValue;
  showCopyDialog.value = true;
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
    message: `Are you sure you want to delete ${activity.data.name}?`,
    action: actionFunc,
  });
};
</script>
