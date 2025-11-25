<template>
  <div class="activity-options-container d-flex">
    <VTooltip
      v-for="it in options"
      :key="it.name"
      content-class="bg-primary-darken-4"
      location="bottom"
    >
      <template #activator="{ props: tooltipProps }">
        <VBtn
          v-bind="tooltipProps"
          :aria-label="it.name"
          :icon="it.icon"
          class="mr-1"
          color="primary-lighten-3"
          size="small"
          variant="text"
          @click.stop="it.action"
        >
        </VBtn>
      </template>
      <span>{{ it.name }}</span>
    </VTooltip>
    <CreateDialog
      v-if="showCreateDialog"
      :action="action"
      :anchor="activity"
      :heading="`${selectedActivity?.getAddDialogHeading(action)}: ${
        activity.data.name
      }`"
      :repository-id="activity.repositoryId"
      @close="showCreateDialog = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { InsertLocation } from '@tailor-cms/utils';

import CreateDialog from '@/components/repository/Outline/CreateDialog/index.vue';

const { AddAfter, AddBefore, AddInto } = InsertLocation;

const props = defineProps<{ activity: StoreActivity }>();

const selectedActivity = useSelectedActivity(props.activity);
const showCreateDialog = ref(false);
const action = ref<InsertLocation>(AddAfter);

const options = computed(() => {
  const { subLevels, isEditable } = selectedActivity;
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
  if (subLevels.value.length) {
    items.push({
      name: 'Add item into',
      icon: 'add:into',
      action: () => setCreateContext(AddInto),
    });
  }
  if (isEditable.value) {
    const { id: activityId, repositoryId } = props.activity;
    const params = { id: repositoryId, activityId };
    items.push({
      name: 'Open',
      icon: 'mdi-page-next-outline',
      action: () => navigateTo({ name: 'editor', params }),
    });
  }
  return items;
});

const setCreateContext = (actionType: InsertLocation) => {
  action.value = actionType;
  showCreateDialog.value = true;
};
</script>
