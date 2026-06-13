<template>
  <div class="activity-actions d-flex align-center ga-1">
    <VBtn
      v-for="{ active, title, icon, action, disabled } in actions"
      :key="title"
      v-tooltip:bottom="{ text: title, offset: 12 }"
      :active="active"
      :aria-label="title"
      :color="active ? 'tertiary' : ''"
      :disabled="disabled"
      class="action-btn"
      density="comfortable"
      icon
      @click.stop="action"
    >
      <VIcon :icon="`mdi-${icon}`" size="small" />
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

const showPublishDiff = computed(() => editorStore.showPublishDiff);

const activityLabel = computed(
  () =>
    $schemaService.getLevel(editorStore.selectedActivity?.type)?.label ||
    'Entry',
);

const hasMetadata = computed(() => {
  if (!editorStore.selectedActivity) return false;
  return !!$schemaService.getActivityMetadata(editorStore.selectedActivity)
    ?.length;
});

const actions = computed(() => {
  const items = [
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
      action: () => editorStore.togglePublishDiff(),
    },
  ];
  if (!currentRepositoryStore.repository?.hasAdminAccess) return items;
  return items.concat({
    title: 'Publish',
    icon: 'cloud-upload-outline',
    action: () => confirmPublishing(),
  });
});

const preview = () => {
  if (!editorStore.selectedActivity) return;
  const { repositoryId, id } = editorStore.selectedActivity;
  return api.activity
    .createPreview({ params: { repositoryId, activityId: id } })
    .then(({ location }: any) => {
      window.location.href = location;
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
  const publishingUtils = usePublishActivity();
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
