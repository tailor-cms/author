<template>
  <VHover v-slot="{ props: hoverProps }" v-model="isHovered">
    <VCard
      v-bind="hoverProps"
      :id="`activity_${activity.uid}`"
      :color="color"
      class="text-left py-2"
      elevation="0"
      rounded="md"
      @mousedown="repositoryStore.selectActivity(activity.id)"
    >
      <VSheet
        class="d-flex align-center my-1 mx-3"
        color="transparent"
        height="32"
      >
        <VChip
          :color="config.color"
          class="px-1"
          size="x-small"
          variant="flat"
        />
        <div class="activity-label text-uppercase ml-2">{{ config.label }}</div>
        <VSpacer />
        <VChip v-if="isSoftDeleted">
          <span class="pr-1 font-weight-bold">Deleted:</span>
          Publish required
          <VIcon
            v-tooltip:bottom="'Will be removed upon publishing'"
            class="ml-2"
            color="secondary"
            icon="mdi-information-outline"
          />
        </VChip>
        <template v-else-if="isHovered || isSelected">
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
                color="primary-lighten-3"
                size="small"
                variant="text"
                @click.stop="it.action"
              >
              </VBtn>
            </template>
            <span>{{ it.name }}</span>
          </VTooltip>
        </template>
      </VSheet>
      <VCardTitle class="pt-0">{{ activity.data.name }}</VCardTitle>
    </VCard>
  </VHover>
</template>

<script lang="ts" setup>
import { activity as activityUtils } from '@tailor-cms/utils';
import first from 'lodash/first';
import sortBy from 'lodash/sortBy';

import type { StoreActivity } from '@/stores/activity';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  activity: StoreActivity;
}>();

const { $schemaService } = useNuxtApp() as any;
const repositoryStore = useCurrentRepository();
const storageService = useStorageService();
const activityStore = useActivityStore();
const selectedActivity = useSelectedActivity(props.activity);
const showConfirmationDialog = useConfirmationDialog();

provide('$storageService', storageService);

const isHovered = ref(false);

const options = computed(() => {
  const items = [
    {
      name: 'Remove',
      icon: 'mdi-delete',
      action: () => deleteActivity(),
    },
  ];
  if (selectedActivity.isEditable.value) {
    const { id: activityId, repositoryId } = props.activity;
    const params = { id: repositoryId, activityId };
    items.unshift({
      name: 'Open',
      icon: 'mdi-page-next-outline',
      action: () => navigateTo({ name: 'editor', params }),
    });
  }
  return items;
});

const config = computed(() => $schemaService.getLevel(props.activity.type));

const isSelected = computed(
  () => repositoryStore.selectedActivity?.uid === props.activity.uid,
);

const isHighlighted = computed(() => isSelected.value || isHovered.value);

const isSoftDeleted = computed(() =>
  activityUtils.doesRequirePublishing(props.activity),
);

const color = computed(() => {
  if (isSoftDeleted.value) return 'primary-darken-4';
  return isHighlighted.value ? 'primary-darken-1' : 'primary-darken-2';
});

const deleteActivity = () => {
  const { activity } = props;
  const actionFunc = () => {
    const focusNode = activity.parentId
      ? activityStore.findById(activity.parentId)
      : first(sortBy(repositoryStore.rootActivities, 'position'));
    activityStore.remove(props.activity.id);
    if (focusNode) repositoryStore.selectActivity(focusNode.id);
  };
  return showConfirmationDialog({
    title: 'Delete item?',
    message: `Are you sure you want to delete ${activity.data.name}?`,
    action: actionFunc,
  });
};
</script>

<style lang="scss" scoped>
.v-card {
  cursor: pointer;
}

.activity-label {
  font-size: 0.75rem;
  line-height: 1.25rem;
  letter-spacing: 1px;
}
</style>
