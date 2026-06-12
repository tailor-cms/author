<template>
  <div class="body position-relative">
    <div class="d-flex align-center my-4 pa-1">
      <div class="d-flex align-center mr-1 text-body-medium font-weight-bold">
        <VIcon :color="config.color" class="mr-2" icon="mdi-label" size="26" />
        <span>{{ config.label.toUpperCase() }}</span>
      </div>
      <VDivider class="my-2 mx-3" vertical />
      <LabelChip
        v-tooltip:bottom="{ text: `${config.label} ID`, openDelay: 100 }"
        :text="activity.shortId"
        density="compact"
      />
      <VSpacer />
      <VBtn
        :key="`${activityUrl}-identifier`"
        v-clipboard:copy="activity.shortId"
        v-clipboard:error="() => notify('Not able to copy the ID')"
        v-clipboard:success="
          () => notify('ID copied to the clipboard', { immediate: true })
        "
        class="mr-2 px-4"
        size="small"
        variant="tonal"
      >
        <VIcon class="mr-1" icon="mdi-content-copy" />
        <VIcon icon="mdi-identifier" />
      </VBtn>
      <VBtn
        :key="`${activityUrl}-link`"
        v-clipboard:copy="activityUrl"
        v-clipboard:error="() => notify('Not able to copy the link')"
        v-clipboard:success="
          () => notify('Link copied to the clipboard', { immediate: true })
        "
        class="px-4"
        size="small"
        variant="tonal"
      >
        <VIcon class="mr-1" icon="mdi-content-copy" />
        <VIcon icon="mdi-link" />
      </VBtn>
    </div>
    <ActivityStatus
      v-if="activity.isTrackedInWorkflow"
      :id="activity.id"
      :activity-status="activity.currentStatus"
      :short-id="activity.shortId"
      :type="activity.type"
      class="mt-4 mb-3"
    />
    <LinkedIndicator
      v-if="activity.isLinkedCopy"
      :activity="activity"
      class="mt-4"
    />
    <SourceUsages
      v-else
      :activity="activity"
      class="mt-4"
      @copy:view="viewCopy"
    />
    <div v-if="!isSoftDeleted">
      <div class="meta-elements mt-6">
        <MetaInput
          v-for="it in metadata"
          :key="`${activity.uid}.${it.key}.${$pluginRegistry.dataVersion}`"
          :meta="it"
          :entity-data="activity.data"
          dark
          @update="updateActivity"
        />
      </div>
      <div>
        <ActivityRelationship
          v-for="relationship in config.relationships"
          :key="`${activity.uid}.${relationship.type}`"
          :activity="activity"
          v-bind="relationship"
        />
      </div>
    </div>
    <ActivityDiscussion
      :activity="activity"
      panel
      show-heading
    />
  </div>
</template>

<script lang="ts" setup>
import { activity as activityUtils } from '@tailor-cms/utils';

import { LinkedIndicator, SourceUsages } from '@/components/repository/Library';
import ActivityDiscussion from '../Discussion/index.vue';
import ActivityRelationship from './ActivityRelationship.vue';
import ActivityStatus from './ActivityStatus.vue';
import LabelChip from '@/components/common/LabelChip.vue';
import MetaInput from '@/components/common/MetaInput.vue';

const props = defineProps<{ activity: StoreActivity }>();

const route = useRoute();
const store = useActivityStore();
const notify = useNotification();
const { $schemaService, $pluginRegistry } = useNuxtApp() as any;

const activityUrl = computed(() => route.query && window.location.href);
const config = computed(() => $schemaService.getLevel(props.activity.type));
const metadata = computed(() =>
  $schemaService.getActivityMetadata(props.activity),
);

const isSoftDeleted = computed(() =>
  activityUtils.doesRequirePublishing(props.activity),
);

const viewCopy = (copy: {
  repositoryId: number;
  outlineActivityId: number;
}) => {
  navigateTo({
    name: 'repository',
    params: { id: copy.repositoryId },
    query: { activityId: copy.outlineActivityId },
  });
};

const updateActivity = async (
  key: string,
  value: any,
  updatedData?: Record<string, any>,
) => {
  // Use processed data if provided, otherwise fallback to simple update
  const data = updatedData ?? { ...props.activity.data, [key]: value };
  await store.update({ id: props.activity.id, uid: props.activity.uid, data });
  notify(`${config.value.label} saved`, { immediate: true });
};
</script>
