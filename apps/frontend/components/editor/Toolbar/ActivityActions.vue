<template>
  <div>
    <VList bg-color="transparent">
      <VTooltip
        v-for="{ active, title, icon, action, disabled } in actions"
        :key="title"
        location="bottom"
      >
        <template #activator="{ props: tooltipProps }">
          <VBtn
            v-bind="tooltipProps"
            :active="active"
            :disabled="disabled"
            :icon="`mdi-${icon}`"
            class="mr-2"
            variant="text"
            @click.stop="action"
          />
        </template>
        <span>{{ title }}</span>
      </VTooltip>
    </VList>
  </div>
</template>

<script lang="ts" setup>
import { activity as api } from '@/api';
import { useCurrentRepository } from '@/stores/current-repository';
import { useEditorStore } from '@/stores/editor';

const currentRepositoryStore = useCurrentRepository();
const editorStore = useEditorStore();
const showPublishDiff = computed(() => editorStore.showPublishDiff);

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
    {
      title: 'Preview',
      icon: 'eye',
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
  return api
    .createPreview(repositoryId, id)
    .then((location) => window.open(location));
};

const confirmPublishing = () => {
  if (!editorStore.selectedActivity) return;
  const publishingUtils = usePublishActivity();
  publishingUtils.confirmPublishing([editorStore.selectedActivity]);
};
</script>

<style lang="scss" scoped>
.v-toolbar ::v-deep .v-toolbar__content {
  padding: 0 0.5rem;
}

.v-btn--active {
  background: rgb(var(--v-theme-secondary)) !important;
  color: white !important;
}
</style>
