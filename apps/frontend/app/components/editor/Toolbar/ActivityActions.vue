<template>
  <div class="activity-actions d-flex align-center ga-1">
    <VBtn
      v-for="{
        active,
        title,
        icon,
        action,
        disabled,
        loading,
        color,
        iconSize,
      } in actions"
      :key="title"
      v-tooltip:bottom="{ text: title, offset: 12 }"
      :active="active"
      :aria-label="title"
      :color="color ?? (active ? 'secondary' : '')"
      :disabled="disabled"
      :loading="loading"
      class="action-btn"
      density="comfortable"
      icon
      @click.stop="action"
    >
      <VIcon :icon="`mdi-${icon}`" :size="iconSize ?? 'small'" />
    </VBtn>
  </div>
</template>

<script lang="ts" setup>
import { api } from '@/api';
import { useContentElementStore } from '@/stores/content-elements';
import { useCurrentRepository } from '@/stores/current-repository';
import { useEditorStore } from '@/stores/editor';

const { $schemaService } = useNuxtApp() as any;

const currentRepositoryStore = useCurrentRepository();
const editorStore = useEditorStore();
const contentElementStore = useContentElementStore();
const publishingUtils = usePublishActivity();

const showPublishDiff = computed(() => editorStore.showDiff);

const activityLabel = computed(
  () =>
    $schemaService.getLevel(editorStore.selectedActivity?.type)?.label ||
    'Entry',
);

const hasMetadata = computed(() => {
  if (!editorStore.selectedActivity) return false;
  // Collection items edit their title inline in the container
  if (currentRepositoryStore.isCollection) return false;
  return !!$schemaService.getActivityMetadata(editorStore.selectedActivity)
    ?.length;
});

interface ToolbarAction {
  title: string;
  icon: string;
  action: () => unknown;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
  iconSize?: string | number;
}

const actions = computed(() => {
  const items: ToolbarAction[] = [
    {
      title: 'Back',
      icon: 'arrow-left',
      action: () => {
        return navigateTo({
          name: 'repository',
          query: { activityId: editorStore.selectedActivity?.id },
        });
      },
    },
    ...(hasMetadata.value
      ? [
          {
            title: `${activityLabel.value} Details`,
            icon: 'text-box-edit-outline',
            active: editorStore.isDetailsPanelExpanded,
            disabled: !editorStore.canExpandDetailsPanel,
            action: () => editorStore.toggleDetailsPanel(),
          },
        ]
      : []),
    {
      title: 'Preview',
      icon: 'eye',
      disabled: !hasContentElements.value,
      action: () => preview(),
    },
    {
      title: showPublishDiff.value
        ? 'Stop comparing with published'
        : 'Compare with published',
      icon: 'plus-minus',
      active: showPublishDiff.value,
      disabled: !editorStore.selectedActivity?.publishedAt,
      action: () => editorStore.toggleDiff(),
    },
  ];
  if (!currentRepositoryStore.access.canPublish) return items;
  return items.concat({
    title: 'Publish',
    icon: publishingUtils.showPublishSuccess.value
      ? 'check-circle-outline'
      : 'cloud-upload-outline',
    color: publishingUtils.showPublishSuccess.value ? 'success' : undefined,
    iconSize: publishingUtils.showPublishSuccess.value ? '1.7em' : undefined,
    loading: publishingUtils.isPublishing.value,
    action: () => confirmPublishing(),
  });
});

const preview = () => {
  if (!editorStore.selectedActivity) return;
  const { repositoryId, id } = editorStore.selectedActivity;
  return api.activity
    .createPreview({ params: { repositoryId, activityId: id } })
    .then(({ location }: any) => {
      window.open(location);
    });
};

const hasContentElements = computed(() => {
  const containerIds = editorStore.contentContainers.map((it) => it.id);
  return (
    !!contentElementStore.items.length &&
    contentElementStore.items.some((it) => containerIds.includes(it.activityId))
  );
});

const confirmPublishing = () => {
  if (!editorStore.selectedActivity) return;
  publishingUtils.confirmPublishing([editorStore.selectedActivity]);
};
</script>

<style lang="scss" scoped>
.v-toolbar :deep(.v-toolbar__content) {
  padding: 0 0.5rem;
}

.v-btn--disabled {
  opacity: 0.35;
}
</style>
