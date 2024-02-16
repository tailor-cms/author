<template>
  <span class="publish-container">
    <VMenu offset="10" position="left">
      <template #activator="{ props }">
        <VBtn
          :loading="publishingUtils.isPublishing.value"
          color="secondary-lighten-4"
          size="small"
          variant="tonal"
          v-bind="props"
        >
          <VIcon class="mr-2">mdi-cloud-upload-outline</VIcon>
          Publish
        </VBtn>
      </template>
      <VList class="text-left px-2">
        <VListItem @click="publishingUtils.confirmPublishing">
          <VListItemTitle>{{ config.label }}</VListItemTitle>
        </VListItem>
        <VListItem
          v-if="activityWithDescendants.length > 1"
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
import fecha from 'fecha';

import PublishingBadge from './Badge.vue';

const props = defineProps<{
  activity: StoreActivity;
  outlineActivities: StoreActivity[];
}>();

const { $schemaService } = useNuxtApp() as any;
const { getDescendants } = activityUtils;
const publishingUtils = usePublishActivity(props.activity);

const config = computed(() => $schemaService.getLevel(props.activity.type));

const publishedAtMessage = computed(() => {
  const { publishedAt } = props.activity;
  return publishedAt
    ? `Published on ${fecha.format(new Date(publishedAt), 'M/D/YY h:mm A')}`
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
  padding: 1.125rem 0.375rem 0 0.25rem;
}
</style>
