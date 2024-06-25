<template>
  <div class="activity-options-container d-flex">
    <VTooltip v-for="it in options" :key="it.name" location="bottom">
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
import CreateDialog from '@/components/repository/Outline/CreateDialog/index.vue';
import InsertLocation from '@/lib/InsertLocation';

const { ADD_AFTER, ADD_BEFORE, ADD_INTO } = InsertLocation;

const props = defineProps<{ activity: StoreActivity }>();

const selectedActivity = useSelectedActivity(props.activity);
const showCreateDialog = ref(false);
const action = ref<InsertLocation>(ADD_AFTER);

const options = computed(() => {
  const { subLevels, isEditable } = selectedActivity;
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
  if (subLevels.value.length) {
    items.push({
      name: 'Add item into',
      icon: 'add:into',
      action: () => setCreateContext(ADD_INTO),
    });
  }
  if (isEditable.value) {
    const { id: activityId, repositoryId } = props.activity;
    const params = { repositoryId, activityId };
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
