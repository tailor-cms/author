<template>
  <div v-if="metadata.length" class="activity-metadata">
    <div class="activity-metadata-wrapper">
      <div class="activity-metadata-header d-flex align-center px-1 pt-4 pb-5">
        <VIcon class="mr-2" color="primary-lighten-4" size="small">
          mdi-text-box-edit-outline
        </VIcon>
        <span class="text-title-small font-weight-bold text-primary-lighten-4">
          {{ activityLabel }} Details
        </span>
      </div>
      <div class="metadata-fields px-1 pb-4">
        <MetaInput
          v-for="it in metadata"
          :key="`${activity.uid}.${it.key}.${$pluginRegistry.dataVersion}`"
          :meta="it"
          :entity-data="activity.data"
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
}>();

const { $schemaService, $pluginRegistry } = useNuxtApp() as any;
const activityStore = useActivityStore();
const notify = useNotification();

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
    notify(`${activityLabel.value} saved`, { immediate: true });
  } catch {
    notify(`Failed to save ${activityLabel.value.toLowerCase()}`, {
      immediate: true,
      color: 'error',
    });
  }
};
</script>

<style lang="scss" scoped>
$error-color: rgb(var(--v-theme-secondary-lighten-4));

.activity-metadata-wrapper {
  position: relative;
  max-width: 72.5rem;
  padding: 1rem 1.25rem;

  :deep(.v-input) {
    position: relative;

    .v-input__details {
      text-align: left;
    }
  }

  :deep(.v-input--error) {
    .v-messages__message,
    .v-field__outline,
    .v-field-label {
      color: $error-color;
    }
  }
}

.activity-metadata-header {
  letter-spacing: 0.05em;
}
</style>
