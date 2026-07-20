<template>
  <div v-if="metadata.length" class="activity-metadata text-left">
    <div class="py-4 px-6">
      <div class="d-flex align-center px-1 pt-4 pb-5">
        <VIcon icon="mdi-text-box-edit-outline" size="small" start />
        <span class="text-title-small font-weight-bold">
          {{ activityLabel }} Details
        </span>
      </div>
      <div class="metadata-fields">
        <MetaInput
          v-for="it in metadata"
          :key="`${activity.uid}.${it.key}.${$pluginRegistry.dataVersion}`"
          :meta="it"
          :entity-data="activity.data"
          :readonly="readonly"
          class="mb-2"
          dark
          @update="updateActivity"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';

import MetaInput from '@/components/common/MetaInput.vue';
import { useActivityStore } from '@/stores/activity';

const props = defineProps<{
  activity: Activity;
  readonly?: boolean;
}>();

const { $schemaService, $pluginRegistry } = useNuxtApp() as any;
const notify = useNotification();
const activityStore = useActivityStore();

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
  try {
    await activityStore.update({ id: props.activity.id, data });
    notify(`${activityLabel.value} saved`);
  } catch {
    notify(`Failed to save ${activityLabel.value.toLowerCase()}`, {
      color: 'error',
    });
  }
};
</script>
