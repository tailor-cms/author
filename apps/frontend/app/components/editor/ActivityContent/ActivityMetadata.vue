<template>
  <VCard
    v-if="metadata.length"
    color="primary-lighten-5 text-primary-darken-5"
    variant="flat"
    rounded="lg"
    class="mb-10"
  >
    <div
      class="activity-metadata-header d-flex align-center px-6 py-4"
      @click="isExpanded = !isExpanded"
    >
      <VIcon class="mr-3" size="small">mdi-text-box-edit-outline</VIcon>
      <span class="text-subtitle-1 font-weight-bold">
        {{ activityLabel }} Details
      </span>
      <VSpacer />
      <VBtn
        :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        size="small"
        variant="text"
        @click.stop="isExpanded = !isExpanded"
      />
    </div>
    <VExpandTransition>
      <div v-show="isExpanded" class="px-6 pb-6">
        <MetaInput
          v-for="it in metadata"
          :key="`${activity.uid}.${it.key}`"
          :meta="it"
          :entity-data="activity.data"
          @update="updateActivity"
        />
      </div>
    </VExpandTransition>
  </VCard>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';

import MetaInput from '@/components/common/MetaInput.vue';
import { useActivityStore } from '@/stores/activity';

const props = defineProps<{
  activity: Activity;
}>();

const { $schemaService } = useNuxtApp() as any;
const activityStore = useActivityStore();
const notify = useNotification();

const isExpanded = ref(false);

const activityConfig = computed(() =>
  $schemaService.getLevel(props.activity.type),
);

const activityLabel = computed(() => activityConfig.value?.label || 'Activity');

const metadata = computed(() =>
  $schemaService.getActivityMetadata(props.activity),
);

const updateActivity = async (
  key: string,
  value: any,
  updatedData?: Record<string, any>,
) => {
  const data = updatedData ?? { ...props.activity.data, [key]: value };
  await activityStore.update({ id: props.activity.id, data });
  notify(`${activityLabel.value} saved`, { immediate: true });
};
</script>

<style lang="scss" scoped>
.activity-metadata-header {
  cursor: pointer;
  user-select: none;
}
</style>
