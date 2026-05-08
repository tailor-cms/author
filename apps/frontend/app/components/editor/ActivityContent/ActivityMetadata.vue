<template>
  <VExpansionPanels
    v-if="metadata.length"
    v-model="panelValue"
    class="mb-10"
    rounded="lg"
  >
    <VExpansionPanel :value="PANEL_NAME" bg-color="white" eager>
      <VExpansionPanelTitle min-height="56" static>
        <VIcon class="mr-2" color="primary-darken-4">
          mdi-text-box-edit-outline
        </VIcon>
        <span class="text-h6 font-weight-medium text-primary-darken-3">
          {{ activityLabel }} Details
        </span>
      </VExpansionPanelTitle>
      <VExpansionPanelText>
        <MetaInput
          v-for="it in metadata"
          :key="`${activity.uid}.${it.key}.${$pluginRegistry.dataVersion}`"
          :meta="it"
          :entity-data="activity.data"
          @update="updateActivity"
        />
      </VExpansionPanelText>
    </VExpansionPanel>
  </VExpansionPanels>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';

import MetaInput from '@/components/common/MetaInput.vue';
import { useActivityStore } from '@/stores/activity';
import { useEditorStore } from '@/stores/editor';

const props = defineProps<{
  activity: Activity;
}>();

const { $schemaService, $pluginRegistry } = useNuxtApp() as any;
const activityStore = useActivityStore();
const editorStore = useEditorStore();
const notify = useNotification();

const PANEL_NAME = 'details';
const panelValue = computed({
  get: () => (editorStore.isDetailsPanelExpanded ? PANEL_NAME : undefined),
  set: (val) => (editorStore.isDetailsPanelExpanded = val === PANEL_NAME),
});

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
:deep(.v-expansion-panel-title:hover > .v-expansion-panel-title__overlay),
:deep(.v-expansion-panel-title:focus > .v-expansion-panel-title__overlay),
:deep(.v-expansion-panel-title--active > .v-expansion-panel-title__overlay) {
  opacity: 0;
}
</style>
