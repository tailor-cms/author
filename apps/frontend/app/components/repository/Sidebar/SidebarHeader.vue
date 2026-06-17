<template>
  <div class="header my-2">
    <div class="options-container d-flex align-center">
      <VBtn
        v-show="!isSoftDeleted"
        class="px-4 mr-3 btn-open"
        prepend-icon="mdi-page-next-outline"
        size="small"
        text="Open"
        variant="tonal"
        @click.stop="edit"
      />
      <VBtn
        v-if="isSoftDeleted"
        class="mr-3"
        prepend-icon="mdi-history"
        size="small"
        text="Restore"
        variant="tonal"
        @click.stop="restore"
      />
      <ActivityPublishing
        v-if="store.repository?.hasAdminAccess"
        :activity="activity"
        :is-soft-deleted="isSoftDeleted"
        :outline-activities="store.outlineActivities"
        :publishing="publishing"
      />
      <VSpacer />
      <ActivityOptions v-if="!isSoftDeleted" :activity="props.activity" />
    </div>
    <div class="publish-status d-flex align-center my-6 mx-1">
      <PublishingBadge :activity="activity" start />
      <span class="text-body-large">{{ publishStatusMessage }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { activity as activityUtils } from '@tailor-cms/utils';
import { format } from 'fecha';

import ActivityPublishing from './ActivityPublishing.vue';
import PublishingBadge from './PublishingBadge.vue';
import ActivityOptions from '@/components/common/ActivityOptions/ActivityMenu.vue';
import { api } from '@/api';
import { useCurrentRepository } from '@/stores/current-repository';
import { useActivityStore } from '@/stores/activity';

const props = defineProps<{ activity: StoreActivity }>();

const activityStore = useActivityStore();
const store = useCurrentRepository();

const isSoftDeleted = computed(() =>
  activityUtils.doesRequirePublishing(props.activity),
);

const publishing = usePublishActivity(props.activity);
const publishStatusMessage = computed(() => {
  const { publishedAt } = props.activity;
  if (publishing.isPublishing.value) return publishing.status.value.message;
  return publishedAt
    ? `Published on ${format(new Date(publishedAt), 'M/D/YY h:mm A')}`
    : 'Not published';
});

const edit = () => {
  const { repositoryId, id: activityId } = props.activity;
  navigateTo({
    name: 'editor',
    params: { id: repositoryId, activityId },
  });
};

const restore = async () => {
  const { id: activityId, repositoryId } = props.activity;
  await api.activity.restore({ params: { repositoryId, activityId } });
  return activityStore.fetch(repositoryId, { outlineOnly: true });
};
</script>
