<template>
  <span class="publish-container">
    <VMenu offset="10" position="left" contained>
      <template #activator="{ props: menuProps }">
        <VBtn
          v-bind="isCollection ? {} : menuProps"
          :loading="publishingUtils.isPublishing.value"
          size="small"
          text="Publish"
          variant="tonal"
          prepend-icon="mdi-cloud-upload-outline"
          @click="isCollection && publishingUtils.confirmPublishing([activity])"
        />
      </template>
      <VList class="text-left px-2">
        <VListItem
          :title="config.label"
          @click="publishingUtils.confirmPublishing([activity])"
        />
        <VListItem
          v-if="!isSoftDeleted && activityWithDescendants.length > 1"
          :title="`${config.label} and children`"
          @click="publishingUtils.confirmPublishing(activityWithDescendants)"
        />
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
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  activity: StoreActivity;
  outlineActivities: StoreActivity[];
  isSoftDeleted: boolean;
}>();

const { $schemaService } = useNuxtApp() as any;
const { getDescendants } = activityUtils;
const publishingUtils = usePublishActivity(props.activity);
const { isCollection } = storeToRefs(useCurrentRepository());

const config = computed(() => $schemaService.getLevel(props.activity.type));

const publishedAtMessage = computed(() => {
  const { publishedAt } = props.activity;
  return publishedAt
    ? `Published on ${format(new Date(publishedAt), 'M/D/YY h:mm A')}`
    : 'Not published';
});

const activityWithDescendants = computed(() => {
  const descendants = getDescendants(
    props.outlineActivities,
    props.activity,
  ) as StoreActivity[];
  return [...descendants, props.activity];
});
</script>

<style lang="scss" scoped>
.publish-status {
  display: flex;
  align-items: center;
  padding: 2rem 0.375rem 0 0.25rem;
}
</style>
