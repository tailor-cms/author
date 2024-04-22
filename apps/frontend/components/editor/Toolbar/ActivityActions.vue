<template>
  <div>
    <VList bg-color="transparent">
      <VTooltip
        v-for="{ title, icon, action, disabled } in actions"
        :key="title"
        location="bottom"
      >
        <template #activator="{ props: tooltipProps }">
          <VBtn
            v-bind="tooltipProps"
            :disabled="disabled"
            active-class="pink-darken-2"
            class="mr-2"
            variant="text"
            icon
            @click.stop="action"
          >
            <VIcon>mdi-{{ icon }}</VIcon>
          </VBtn>
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
// TODO: Publish diff needs to be implemented
// const showPublishDiff = computed(() => false);

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
    // TODO: Needs to be implemented
    // {
    //   title: showPublishDiff.value
    //     ? 'Stop comparing with published'
    //     : 'Compare with published',
    //   icon: 'plus-minus',
    //   active: showPublishDiff.value,
    //   disabled: !editorStore.selectedActivity?.publishedAt,
    //   // TODO: Needs to be implemented
    //   // store.commit('editor/togglePublishDiff')
    //   action: () => null,
    // },
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
</style>
