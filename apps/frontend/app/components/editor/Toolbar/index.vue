<template>
  <VAppBar
    :color="toolbarColor"
    border="b"
    class="toolbar-wrapper"
    order="1"
  >
    <div v-if="activity && !element" class="activity-toolbar w-100 px-3">
      <ActivityActions />
      <h1
        v-if="mdAndUp"
        class="activity-title text-title-medium text-truncate ml-2"
      >
        <span class="font-weight-medium">{{ config.label }}</span>
        <span class="title-separator">/</span>
        <VIcon
          v-if="activity?.isLinkedCopy"
          v-tooltip:bottom="'Linked from another repository'"
          class="link-icon mr-1"
          color="tertiary"
          icon="mdi-link-box"
          size="small"
        />
        <ActivityName
          :activity="activity"
          :class="[
            'activity-name font-weight-medium',
            activity?.isLinkedCopy ? 'text-tertiary' : '',
          ]"
        />
        <template v-if="showPublishDiff">
          <span class="title-separator">·</span>
          <span class="text-body-small">comparing with published</span>
          <VChip
            v-if="activity.publishedAt"
            :text="formatDate(activity.publishedAt, 'MM/dd/yy HH:mm')"
            class="ml-2"
            size="x-small"
            label
          />
        </template>
      </h1>
      <div class="toolbar-trailing d-flex align-center ga-2">
        <template v-if="activity?.isLinkedCopy">
          <VBtn
            :disabled="!source"
            prepend-icon="mdi-open-in-new"
            size="small"
            text="View source"
            variant="tonal"
            @click="source && viewSource(source)"
          />
          <VBtn
            prepend-icon="mdi-link-variant-off"
            size="small"
            text="Unlink"
            variant="tonal"
            @click="activity && unlinkActivity(activity.id)"
          />
        </template>
        <ActiveUsersGroup
          v-if="!showPublishDiff && usersWithActivity.length"
          :users="usersWithActivity"
          :size="32"
        />
        <VAppBarNavIcon
          v-if="mdAndDown && !!editorStore.guidelines"
          color="tertiary"
          variant="tonal"
          icon="mdi-format-list-checks"
          size="small"
          @click="$emit('toggle-guidelines')"
        />
      </div>
    </div>
    <ElementToolbarContainer
      v-if="element"
      :element="element"
      class="element-container w-100"
    />
  </VAppBar>
</template>

<script lang="ts" setup>
import { ActiveUsersGroup } from '@tailor-cms/core-components';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { formatDate } from 'date-fns/format';
import { activity as activityApi } from '@/api';
import ActivityActions from './ActivityActions.vue';
import ActivityName from '@/components/common/ActivityName.vue';
import ElementToolbarContainer from './ElementToolbarContainer.vue';
import { useEditorStore } from '@/stores/editor';
import { useUserTracking } from '@/stores/user-tracking';
import { useDisplay } from 'vuetify';

interface Props {
  element?: ContentElement | null;
}

interface SourceInfo {
  id: number;
  repository: { id: number; name: string };
}

withDefaults(defineProps<Props>(), {
  element: null,
});

defineEmits(['toggle-guidelines']);

const { $schemaService } = useNuxtApp() as any;

const showPublishDiff = computed(() => editorStore.showPublishDiff);

const notify = useNotification();
const editorStore = useEditorStore();
const userTrackingStore = useUserTracking();
const { mdAndUp, mdAndDown } = useDisplay();

const activity = computed(() => editorStore.selectedActivity);
const config = computed(
  () => activity.value && $schemaService.getLevel(activity.value?.type),
);

const toolbarColor = computed(() => {
  return showPublishDiff.value ? 'surface-container-lowest' : 'surface-container-low';
});

// Source info for linked activities
const source = ref<SourceInfo | null>(null);

const viewSource = (sourceInfo: SourceInfo) => {
  navigateTo({
    name: 'repository',
    params: { id: sourceInfo.repository.id },
    query: { activityId: sourceInfo.id },
  });
};

const unlinkActivity = async (activityId: number) => {
  try {
    await editorStore.unlinkActivity(activityId);
    notify('Activity unlinked', { immediate: true });
  } catch {
    notify('Failed to unlink activity', { color: 'error' });
  }
};

watch(activity, async (val) => {
  source.value = null;
  if (!val?.isLinkedCopy) return;
  source.value = await activityApi
    .getSource(val.repositoryId, val.id)
    .catch(() => null);
}, { immediate: true });

const usersWithActivity = computed(() => {
  return userTrackingStore.getActiveUsers(
    'activity',
    editorStore.selectedActivity?.id,
  );
});
</script>

<style lang="scss" scoped>
.toolbar-wrapper {
  > :deep(.v-toolbar__content) {
    height: auto !important;
    min-height: 4rem;
    padding: 0;
    overflow: visible;
  }

  :deep(.v-input) {
    position: relative;

    .v-input__details {
      position: absolute;
      padding: 0;

      .v-messages__message {
        margin-top: 0.5rem;
        border-radius: 4px;
        padding: 0.5rem 0.75rem;
        background-color: rgb(var(--v-theme-inverse-surface));
        color: rgb(var(--v-theme-inverse-on-surface));
      }
    }
  }
}

.activity-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  min-height: 4rem;
  min-width: 0;
  gap: 0.25rem;
}

.activity-title {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  padding: 0 0.5rem;
  text-align: left;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-name {
  letter-spacing: 0.01em;
}

.title-separator {
  margin: 0 0.5rem;
}

.toolbar-trailing {
  flex-shrink: 0;
  padding-right: 0.5rem;
}

.rail-divider {
  height: 1.5rem;
  align-self: center;
}
</style>
