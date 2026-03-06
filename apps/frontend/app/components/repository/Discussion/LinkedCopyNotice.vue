<template>
  <VCard class="d-flex align-center pa-3" variant="tonal">
    <VTooltip location="bottom" open-delay="500">
      <template #activator="{ props: tooltipProps }">
        <span
          v-bind="tooltipProps"
          class="d-flex align-center text-body-2 text-uppercase font-weight-bold"
        >
          <VIcon
            color="lime"
            icon="mdi-comment-off-outline"
            size="small"
            start
          />
          Comments disabled
        </span>
      </template>
      Comments are disabled for linked content
    </VTooltip>
    <VSpacer />
    <VBtn
      :loading="isLoading"
      color="primary-lighten-4"
      size="small"
      variant="tonal"
      @click="viewSourceComments"
    >
      View on source
      <VIcon end>mdi-arrow-right</VIcon>
    </VBtn>
  </VCard>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import { activity as activityApi } from '@/api';

interface Props {
  repositoryId: number;
  activityId: number;
}

const props = defineProps<Props>();

const isLoading = ref(false);

const viewSourceComments = async () => {
  isLoading.value = true;
  try {
    const source = await activityApi.getSource(
      props.repositoryId,
      props.activityId,
    );
    if (!source?.repository) return;
    navigateTo({
      name: 'repository',
      params: { id: source.repository.id },
      query: { activityId: source.id },
    });
  } finally {
    isLoading.value = false;
  }
};
</script>
