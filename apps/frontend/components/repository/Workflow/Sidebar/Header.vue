<template>
  <div>
    <div class="text-body-2 mt-5 mb-2">
      Related <span class="text-lowercase">{{ activityConfig.label }}</span>
    </div>
    <ActivityCard
      v-bind="{ id: props.id, name: props.name, shortId: props.shortId }"
      :color="activityConfig.color"
      :type-label="activityConfig.label"
      class="mb-8"
    />
    <VTooltip open-delay="500" bottom>
      <template #activator="{ props: tooltipProps }">
        <LabelChip v-bind="tooltipProps">{{ props.shortId }}</LabelChip>
      </template>
      {{ activityConfig.label }} ID
    </VTooltip>
    <VBtn
      :key="`${statusUrl}-identifier`"
      v-clipboard:copy="shortId"
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
    <div class="mt-2 text-caption">
      Created at {{ truncateSeconds(createdAt) }}
      <template v-if="isUpdated">
        <span class="mx-1">|</span>
        Updated at {{ truncateSeconds(updatedAt) }}
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { formatDate } from 'date-fns/format';
import { isBefore } from 'date-fns/isBefore';

import ActivityCard from './ActivityCard.vue';
import LabelChip from '@/components/common/LabelChip.vue';

interface Props {
  id: number;
  shortId: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  updatedAt: null,
});

const route = useRoute();
const notify = useNotification();
const { $schemaService } = useNuxtApp() as any;

const statusUrl = computed(() => route.query && window.location.href);
const activityConfig = computed(() => $schemaService.getLevel(props.type));

const isUpdated = computed(() => {
  if (!props.updatedAt) return false;
  const createdAt = truncateSeconds(new Date(props.createdAt));
  const updatedAt = truncateSeconds(new Date(props.updatedAt));
  return isBefore(createdAt, updatedAt);
});

const truncateSeconds = (date: Date) => {
  const format = 'MM/dd/yy HH:mm';
  return formatDate(date, format);
};
</script>
