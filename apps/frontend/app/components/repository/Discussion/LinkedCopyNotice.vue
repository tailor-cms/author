<template>
  <VCard class="d-flex align-center pa-2 pl-3" variant="tonal">
    <span
      v-tooltip:bottom="{
        text: 'Comments are disabled for linked content',
        openDelay: 500,
      }"
      class="d-flex align-center text-body-medium text-uppercase font-weight-bold"
    >
      <VIcon
        color="tertiary"
        icon="mdi-comment-off-outline"
        size="small"
        start
      />
      Comments disabled
    </span>
    <VSpacer />
    <VBtn
      :loading="isLoading"
      append-icon="mdi-arrow-right"
      size="small"
      text="View on source"
      variant="text"
      @click="viewSourceComments"
    />
  </VCard>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { api } from '@/api';

interface Props {
  repositoryId: number;
  activityId: number;
}

const props = defineProps<Props>();

const isLoading = ref(false);

const viewSourceComments = async () => {
  isLoading.value = true;
  try {
    const source = await api.activity.getSource({
      params: {
        repositoryId: props.repositoryId,
        activityId: props.activityId,
      },
    });
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
