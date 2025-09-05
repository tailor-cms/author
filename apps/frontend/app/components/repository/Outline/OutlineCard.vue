<template>
  <VHover v-slot="{ props: hoverProps }" v-model="isHovered">
    <VCard
      v-bind="hoverProps"
      :id="`activity_${props.activity.uid}`"
      :color="color"
      class="text-left py-2"
      elevation="0"
      height="130"
      @mousedown="repositoryStore.selectActivity(props.activity.id)"
    >
      <VSheet
        class="d-flex align-center my-1 mx-4"
        color="transparent"
        height="32"
      >
        <VChip
          :color="config.color"
          class="px-2"
          size="x-small"
          variant="flat"
        />
        <div class="activity-label text-uppercase ml-2">{{ config.label }}</div>
        <VSpacer />
        <VChip v-if="isSoftDeleted" rounded="lg" size="small">
          <span class="pr-1 font-weight-bold">Deleted:</span>
          Publish required
          <VIcon
            v-tooltip:bottom="'Will be removed upon publishing'"
            class="ml-2"
            color="secondary"
            icon="mdi-information-outline"
          />
        </VChip>
        <VFadeTransition>
          <div v-if="!isSoftDeleted && (isHovered || isSelected)">
            <VBtn
              v-if="selectedActivity.isEditable"
              color="primary-lighten-4"
              prepend-icon="mdi-pencil"
              size="small"
              text="Edit"
              variant="text"
              @click.stop="openEditor"
            />
            <VBtn
              v-tooltip:bottom="'Remove'"
              color="primary-lighten-4"
              density="comfortable"
              icon="mdi-delete"
              size="small"
              variant="text"
              @click.stop="deleteActivity"
            />
          </div>
        </VFadeTransition>
      </VSheet>
      <VCardTitle class="text-primary-lighten-5 pa-0 ma-4">
        {{ props.activity.data.name }}
      </VCardTitle>
    </VCard>
  </VHover>
</template>

<script lang="ts" setup>
import { activity as activityUtils } from '@tailor-cms/utils';
import { first, sortBy } from 'lodash-es';

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

const openEditor = () => {
  const { id: activityId, repositoryId } = props.activity;
  const params = { id: repositoryId, activityId };
  navigateTo({ name: 'editor', params });
};

const deleteActivity = () =>
  showConfirmationDialog({
    title: 'Delete item?',
    message: `Are you sure you want to delete ${props.activity.data.name}?`,
    action: () => {
      const focusNode = props.activity.parentId
        ? activityStore.findById(props.activity.parentId)
        : first(sortBy(repositoryStore.rootActivities, 'position'));
      activityStore.remove(props.activity.id);
      if (focusNode) repositoryStore.selectActivity(focusNode.id);
    },
  });
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

.v-card-title {
  white-space: normal;
  word-break: break-word;
  overflow: hidden;
  /* stylelint-disable-next-line value-no-vendor-prefix */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.1;
}
</style>
