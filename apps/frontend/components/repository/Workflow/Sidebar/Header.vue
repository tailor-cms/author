<template>
  <div>
    <div class="text-body-2 mt-5 mb-2">
      Related <span class="text-lowercase">{{ activityConfig.label }}</span>
    </div>
    <ActivityCard
      :id="activity.id"
      :color="activityConfig.color"
      :name="activity.data.name"
      :short-id="activity.shortId"
      :type-label="activityConfig.label"
      class="mb-8"
    />
    <VTooltip open-delay="500" bottom>
      <template #activator="{ props: tooltipProps }">
        <LabelChip v-bind="tooltipProps">{{ activity.shortId }}</LabelChip>
      </template>
      {{ activityConfig.label }} ID
    </VTooltip>
    <VBtn
      :key="`${statusUrl}-identifier`"
      v-clipboard:copy="activity.shortId"
      v-clipboard:error="() => notify('Not able to copy the ID')"
      v-clipboard:success="
        () => notify('ID copied to the clipboard', { immediate: true })
      "
      class="ml-2"
      color="primary-lighten-3"
      prepend-icon="mdi-identifier"
      size="small"
      variant="tonal"
    >
      Copy id
    </VBtn>
    <VBtn
      :key="`${statusUrl}-identifier`"
      v-clipboard:copy="statusUrl"
      v-clipboard:error="() => notify('Not able to copy the link')"
      v-clipboard:success="
        () => notify('Link copied to the clipboard', { immediate: true })
      "
      class="ml-2"
      color="primary-lighten-3"
      prepend-icon="mdi-link"
      size="small"
      variant="tonal"
    >
      Copy link
    </VBtn>
    <div class="mt-2 text-caption">{{ timestampInfo }}</div>
  </div>
</template>

<script lang="ts" setup>
import { formatDate } from 'date-fns/format';
import { isBefore } from 'date-fns/isBefore';

import ActivityCard from './ActivityCard.vue';
import LabelChip from '@/components/common/LabelChip.vue';

const props = defineProps<{
  activity: StoreActivity;
}>();

const route = useRoute();
const notify = useNotification();
const { $schemaService } = useNuxtApp() as any;

const statusUrl = computed(() => route.query && window.location.href);
const activityConfig = computed(() =>
  $schemaService.getLevel(props.activity.type),
);

const timestampInfo = computed(() => {
  const format = 'MM/dd/yy HH:mm';
  const createdAt = formatDate(props.activity.createdAt, format);
  const updatedAt = formatDate(props.activity.status.updatedAt, format);
  const isUpdated = isBefore(createdAt, updatedAt);

  if (!isUpdated) return `Created at ${createdAt}`;
  return `Created at ${createdAt} | Updated at ${updatedAt}`;
});
</script>
