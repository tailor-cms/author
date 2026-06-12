<template>
  <VMenu offset="10" position="left" contained>
    <template #activator="{ props: menuProps }">
      <VBtn
        v-bind="isCollection ? {} : menuProps"
        :loading="publishing.isPublishing.value"
        size="small"
        text="Publish"
        variant="tonal"
        prepend-icon="mdi-cloud-upload-outline"
        @click="isCollection && publishing.confirmPublishing([activity])"
      />
    </template>
    <VList class="text-left px-2">
      <VListItem
        :title="config.label"
        @click="publishing.confirmPublishing([activity])"
      />
      <VListItem
        v-if="!isSoftDeleted && activityWithDescendants.length > 1"
        :title="`${config.label} and children`"
        @click="publishing.confirmPublishing(activityWithDescendants)"
      />
    </VList>
  </VMenu>
</template>

<script lang="ts" setup>
import { activity as activityUtils } from '@tailor-cms/utils';

import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  activity: StoreActivity;
  outlineActivities: StoreActivity[];
  isSoftDeleted: boolean;
  publishing: ReturnType<typeof usePublishActivity>;
}>();

const { $schemaService } = useNuxtApp() as any;
const { getDescendants } = activityUtils;
const { isCollection } = storeToRefs(useCurrentRepository());

const config = computed(() => $schemaService.getLevel(props.activity.type));

const activityWithDescendants = computed(() => {
  const descendants = getDescendants(
    props.outlineActivities,
    props.activity,
  ) as StoreActivity[];
  return [...descendants, props.activity];
});
</script>
