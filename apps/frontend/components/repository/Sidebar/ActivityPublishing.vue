<template>
  <span class="publish-container">
    <VMenu offset="10" position="left" contained>
      <template #activator="{ props: menuProps }">
        <VBtn
          :loading="publishingUtils.isPublishing.value"
          color="primary-lighten-4"
          size="small"
          variant="tonal"
          v-bind="menuProps"
        >
          <VIcon class="mr-2">mdi-cloud-upload-outline</VIcon>
          Publish
        </VBtn>
      </template>
      <VList class="text-left px-2">
        <VListItem @click="publishingUtils.confirmPublishing([activity])">
          <VListItemTitle>{{ config.label }}</VListItemTitle>
        </VListItem>
        <VListItem
          v-if="!isSoftDeleted && activityWithDescendants.length > 1"
          @click="publishingUtils.confirmPublishing(activityWithDescendants)"
        >
          <VListItemTitle>{{ config.label }} and children</VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
    <div class="publish-status">
      <PublishingBadge :activity="activity" />
      <span class="pl-1">
        {{
          publishingUtils.isPublishing.value
            ? publishingUtils.status.value.message
            : publishedAtMessage
        }}
      </span>
    </div>
  </span>
</template>

<script lang="ts" setup>
import { activity as activityUtils } from '@tailor-cms/utils';
import { format } from 'fecha';

import PublishingBadge from './PublishingBadge.vue';

const props = defineProps<{
  activity: StoreActivity;
  outlineActivities: StoreActivity[];
  isSoftDeleted: boolean;
}>();

const { $schemaService } = useNuxtApp() as any;
const { getDescendants } = activityUtils;
const publishingUtils = usePublishActivity(props.activity);

const config = computed(() => $schemaService.getLevel(props.activity.type));

const publishedAtMessage = computed(() => {
  const { publishedAt } = props.activity;
  return publishedAt
    ? `Published on ${format(new Date(publishedAt), 'M/D/YY h:mm A')}`
    : 'Not published';
});

const activityWithDescendants = computed(() => {
  return [
    ...getDescendants(props.outlineActivities, props.activity),
    props.activity,
  ];
});
</script>

<style lang="scss" scoped>
.publish-status {
  display: flex;
  align-items: center;
  padding: 2rem 0.375rem 0 0.25rem;
}
</style>
