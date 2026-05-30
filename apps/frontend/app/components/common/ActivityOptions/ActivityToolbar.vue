<template>
  <div class="activity-options-container d-flex ga-1 mr-1">
    <VBtn
      v-for="it in options"
      :key="it.name"
      v-tooltip:bottom="it.name"
      :aria-label="it.name"
      :icon="it.icon"
      size="small"
      variant="text"
      @click.stop="it.action"
    />
    <CreateDialog
      v-if="showCreateDialog"
      :action="action"
      :anchor="activity"
      :heading="`${selectedActivity?.getAddDialogHeading(action)}: ${activityName}`"
      :repository-id="activity.repositoryId"
      @close="showCreateDialog = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { InsertLocation } from '@tailor-cms/utils';
import { useDisplay } from 'vuetify';

import CreateDialog from '@/components/repository/Outline/CreateDialog/index.vue';

const { AddAfter, AddBefore, AddInto } = InsertLocation;
const { $pluginRegistry } = useNuxtApp() as any;

const props = defineProps<{ activity: StoreActivity }>();

const { smAndUp } = useDisplay();
const selectedActivity = useSelectedActivity(props.activity);

// Get processed name via plugin hooks
const activityName = computed(() => {
  const data = props.activity?.data;
  if (!data) return '';
  const rawValue = data.name ?? '';
  return $pluginRegistry.filter('data:value', rawValue, { data, key: 'name' });
});
const showCreateDialog = ref(false);
const action = ref<InsertLocation>(AddAfter);

const options = computed(() => {
  const { subLevels, isEditable } = selectedActivity;
  const items = [];
  if (smAndUp.value) {
    items.push({
      name: 'Add item above',
      icon: 'add:above',
      action: () => setCreateContext(AddBefore),
    });
    items.push({
      name: 'Add item below',
      icon: 'add:below',
      action: () => setCreateContext(AddAfter),
    });
    if (subLevels.value.length) {
      items.push({
        name: 'Add item into',
        icon: 'add:into',
        action: () => setCreateContext(AddInto),
      });
    }
  };
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
