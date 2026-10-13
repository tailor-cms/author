<template>
  <VAppBar
    :class="{
      'diff-mode': isHistoryMode || showPublishDiff,
      'linked-mode': isLinked,
    }"
    color="surface-canvas"
    border="b"
    class="toolbar-wrapper"
    order="1"
  >
    <HistoryToolbar v-if="isHistoryMode" />
    <div v-else-if="activity" class="activity-toolbar w-100 px-3">
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
          color="secondary"
          icon="mdi-link-box"
          size="small"
        />
        <span class="activity-name font-weight-medium">
          {{ getActivityName(activity) }}
        </span>
        <template v-if="showPublishDiff">
          <span class="title-separator">·</span>
          <span class="text-body-small">comparing with published</span>
          <VChip
            v-if="activity.publishedAt"
            :text="formatDate(activity.publishedAt, 'MM/dd/yy HH:mm')"
            class="ml-2"
            data-percy="hide"
            size="x-small"
            label
          />
        </template>
      </h1>
      <div class="toolbar-trailing d-flex align-center ga-2">
        <template v-if="isLinked">
          <VBtn
            :disabled="!source"
            prepend-icon="mdi-open-in-new"
            size="small"
            text="View source"
            variant="tonal"
            @click="viewSource"
          />
          <VBtn
            prepend-icon="mdi-link-variant-off"
            size="small"
            text="Unlink"
            variant="tonal"
            @click="unlinkActivity"
          />
        </template>
        <ActiveUsersGroup
          v-if="!showPublishDiff && usersWithActivity.length"
          :users="usersWithActivity"
          :size="32"
        />
        <ActivityPagination />
      </div>
    </div>
  </VAppBar>
</template>

<script lang="ts" setup>
import { ActiveUsersGroup } from '@tailor-cms/core-components';
import { formatDate } from 'date-fns/format';

import ActivityActions from './ActivityActions.vue';
import ActivityPagination from './ActivityPagination.vue';
import HistoryToolbar from './HistoryToolbar.vue';
import { useEditorStore } from '@/stores/editor';
import { useUserTracking } from '@/stores/user-tracking';
import { useDisplay } from 'vuetify';

const { $schemaService } = useNuxtApp() as any;

const showPublishDiff = computed(() => editorStore.showDiff);
const isHistoryMode = computed(() => editorStore.isHistoryMode);

const { getActivityName } = useActivityName();
const notify = useNotification();
const editorStore = useEditorStore();
const userTrackingStore = useUserTracking();
const { mdAndUp } = useDisplay();

const activity = computed(() => editorStore.selectedActivity);
const isLinked = computed(() => !!activity.value?.isLinkedCopy);
const config = computed(
  () => activity.value && $schemaService.getLevel(activity.value?.type),
);

const { source, viewSource } = useActivitySource(activity);

const unlinkActivity = async () => {
  if (!activity.value) return;
  try {
    await editorStore.unlinkActivity(activity.value.id);
    notify('Activity unlinked');
  } catch {
    notify('Failed to unlink activity', { color: 'error' });
  }
};

const usersWithActivity = computed(() => {
  return userTrackingStore.getActiveUsers(
    'activity',
    editorStore.selectedActivity?.id,
  );
});
</script>

<style lang="scss" scoped>
.toolbar-wrapper {
  // Ocean marks a linked page; a neutral wash marks an inspection
  // (diff/history) state. Preview wins when a linked page is inspected.
  &.linked-mode {
    --mode-tint: rgba(var(--v-theme-secondary-container), 0.5);
    --mode-border: rgb(var(--v-theme-secondary-container));
  }

  &.diff-mode {
    --mode-tint: rgb(var(--v-theme-surface-container-highest));
    --mode-border: rgb(var(--v-theme-outline-variant));
  }

  &.linked-mode,
  &.diff-mode {
    border-bottom-color: var(--mode-border);

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-color: var(--mode-tint);
      pointer-events: none;
    }
  }

  > :deep(.v-toolbar__content) {
    height: auto !important;
    min-height: 4rem;
    padding: 0;
    overflow: visible;
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
</style>
