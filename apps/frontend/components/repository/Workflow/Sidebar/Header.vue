<template>
  <header>
    <div class="mt-5">
      <div class="text-body-2 mb-2">
        Related <span class="text-lowercase">{{ activityConfig.label }}</span>
      </div>
      <ActivityCard
        v-bind="{ id: props.id, name: props.name, shortId: props.shortId }"
        :color="activityConfig.color"
        :type-label="activityConfig.label"
      />
    </div>
    <div class="mt-8">
      <VTooltip open-delay="500" bottom>
        <template #activator="{ props: tooltipProps }">
          <LabelChip v-bind="tooltipProps">{{ props.shortId }}</LabelChip>
        </template>
        {{ activityConfig.label }} ID
      </VTooltip>
      <VBtn
        v-clipboard:copy="shortId"
        v-clipboard:error="() => $snackbar.show('Not able to copy the ID')"
        v-clipboard:success="
          () => {
            $snackbar.show('ID copied to the clipboard', { immediate: true });
          }
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
        v-clipboard:copy="statusUrl"
        v-clipboard:error="() => $snackbar.show('Not able to copy the link')"
        v-clipboard:success="
          () => {
            $snackbar.show('Link copied to the clipboard', { immediate: true });
          }
        "
        class="ml-2"
        color="primary-lighten-3"
        prepend-icon="mdi-link"
        size="small"
        variant="tonal"
      >
        Copy link
      </VBtn>
      <div class="mt-1 text-caption grey--text text--darken-1">
        Created at {{ truncateSeconds(createdAt) }}
        <template v-if="isUpdated">
          <span class="mx-1">|</span>
          Updated at {{ truncateSeconds(updatedAt) }}
        </template>
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { formatDate } from 'date-fns/format';
import { isBefore } from 'date-fns/isBefore';

import ActivityCard from './ActivityCard.vue';
// import { computed, ref } from 'vue';
// import fecha from 'fecha';
// import { useSnackbar } from '@nuxtjs/composition-api';
// import { useClipboard } from 'vue-clipboard-next';
import LabelChip from '@/components/common/LabelChip';

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

const { $schemaService } = useNuxtApp() as any;

const activityConfig = computed(() => $schemaService.getLevel(props.type));

const isUpdated = computed(() => {
  if (!props.updatedAt) return false;
  const createdAt = truncateSeconds(new Date(props.createdAt));
  const updatedAt = truncateSeconds(new Date(props.updatedAt));
  return isBefore(createdAt, updatedAt);
});

const statusUrl = window.location.href;

// const { show: showSnackbar } = useSnackbar();
// const { toClipboard } = useClipboard();

const truncateSeconds = (date: Date) => {
  const format = 'MM/dd/yy HH:mm';
  return formatDate(date, format);
};
</script>
