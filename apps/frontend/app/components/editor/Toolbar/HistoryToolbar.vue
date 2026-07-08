<template>
  <div class="history-toolbar d-flex align-center w-100 px-4 ga-2">
    <VIcon icon="mdi-history" size="small" />
    <div class="status-text text-title-small text-truncate">
      Viewing version from
      <span class="font-weight-medium">{{ formattedDate }}</span>
      <span class="mx-2">·</span>
      edited by {{ revision.user?.label ?? 'Unknown' }}
    </div>
    <VSpacer />
    <VTooltip
      :disabled="!isAgentRunning"
      location="bottom"
      text="Unavailable while Renoir is generating"
    >
      <template #activator="{ props: tooltipProps }">
        <span v-bind="tooltipProps">
          <VBtn
            :disabled="isAgentRunning"
            :loading="isRestoring"
            prepend-icon="mdi-restore"
            size="small"
            text="Restore this version"
            variant="tonal"
            @click="confirmRestore"
          />
        </span>
      </template>
    </VTooltip>
    <VBtn
      v-tooltip:bottom="{ text: 'Exit history', openDelay: 300 }"
      :disabled="isRestoring"
      aria-label="Exit history view"
      color="primary-lighten-4"
      icon="mdi-close"
      size="small"
      variant="text"
      @click="editorStore.exitHistoryMode"
    />
  </div>
</template>

<script lang="ts" setup>
import { formatDate } from '@vueuse/core';

import { api } from '@/api';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useEditorStore } from '@/stores/editor';

const editorStore = useEditorStore();
const notify = useNotification();
const showConfirmationDialog = useConfirmationDialog();
const { isAgentRunning } = useAgentRunState();

const isRestoring = ref(false);

const revision = computed(() => editorStore.historyRevision!);

const formattedDate = computed(() =>
  formatDate(new Date(revision.value.createdAt), 'M/D/YY h:mm A'),
);

const confirmRestore = () => {
  const activity = editorStore.selectedActivity;
  // Guard against a stale entry point restoring over content Renoir is
  // still writing; the button is disabled for the same reason.
  if (!activity || isAgentRunning.value) return;
  const message =
    `Restore activity to its state from ${formattedDate.value}? ` +
    'Changes made since then will be undone. A new revision is recorded ' +
    'so this is itself undoable.';
  showConfirmationDialog({
    title: 'Restore this version',
    message,
    action: restore,
  });
};

const restore = async () => {
  const activity = editorStore.selectedActivity;
  if (!activity) return;
  isRestoring.value = true;
  try {
    await api.revision.restore({
      params: { repositoryId: activity.repositoryId },
      body: {
        activityId: activity.id,
        timestamp: revision.value.createdAt,
      },
    });
    notify('Activity restored', { immediate: true });
    editorStore.exitHistoryMode();
  } catch {
    notify('Failed to restore activity', { color: 'error' });
  } finally {
    isRestoring.value = false;
  }
};
</script>
