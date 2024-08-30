<template>
  <div>
    <VList bg-color="transparent">
      <VTooltip
        v-for="{ active, title, icon, action, disabled } in actions"
        :key="title"
        content-class="bg-primary-darken-4"
        location="bottom"
        offset="24"
      >
        <template #activator="{ props: tooltipProps }">
          <VBtn
            v-bind="tooltipProps"
            :active="active"
            :aria-label="title"
            :color="active ? 'secondary-lighten-3' : 'primary-lighten-1'"
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
import { useContentElementStore } from '@/stores/content-elements';
import { useCurrentRepository } from '@/stores/current-repository';
import { useEditorStore } from '@/stores/editor';

const currentRepositoryStore = useCurrentRepository();
const editorStore = useEditorStore();
const contentElementStore = useContentElementStore();

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
  return api.createPreview(repositoryId, id).then((location) => {
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
</style>
