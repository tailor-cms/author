import type { StoreActivity } from '@/stores/activity';

import { schema as schemaApi } from '@tailor-cms/config';
import { refAutoReset } from '@vueuse/core';
import Promise from 'bluebird';
import pMinDelay from 'p-min-delay';
import pluralize from 'pluralize-esm';

import { api } from '@/api';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

const MIN_PUBLISH_MS = 1500;
const PUBLISHED_FLASH_MS = 2000;
const initialStatus = () => ({ progress: 0, message: '' });
const prefix = (msg: string) => `Are you sure you want to publish ${msg}`;

const activityLabel = (activity: StoreActivity) =>
  pluralize.singular(schemaApi.getActivityLabel(activity) || 'item');

export const usePublishActivity = (anchorActivity?: StoreActivity) => {
  const currentRepository = useCurrentRepository();
  const activityStore = useActivityStore();
  const confirmationDialog = useConfirmationDialog();
  const notify = useNotification();

  const status = ref(initialStatus());
  const isPublishing = computed(() => status.value.progress > 0);
  // Briefly confirm a successful publish once the
  // spinner clears; refAutoReset flips it back after the delay.
  const showPublishSuccess = refAutoReset(false, PUBLISHED_FLASH_MS);

  const getPublishMessage = (items: StoreActivity[]) => {
    const activityCount = items.length;
    const totalActivities = currentRepository.outlineActivities.length;
    const activity = anchorActivity ?? items[0]!;
    const label = activityLabel(activity);
    const target = `the ${label} "${activity.data.name}"`;
    if (activityCount === 1) return prefix(`${target}?`);
    if (activityCount === totalActivities) return prefix('all content?');
    return prefix(`${target} and all its descendants?`);
  };

  const publish = (activities: StoreActivity[]) => {
    const task = Promise.each(
      activities,
      (activity: StoreActivity, i: number) => {
        const progress = (i + 1) / activities.length;
        const message = `Publishing ${activity.data.name}`;
        status.value = { progress, message };
        return activityStore.publish(activity);
      },
    );
    // Keep the progress indicator visible long enough
    // so the button spinner doesn't just flicker.
    return pMinDelay(task, MIN_PUBLISH_MS).finally(
      () => (status.value = initialStatus()),
    );
  };

  const confirmPublishing = (activities: StoreActivity[]) => {
    const activity = anchorActivity ?? activities[0]!;
    const label = activityLabel(activity);
    confirmationDialog({
      title: `Publish ${label}`,
      icon: 'mdi-cloud-upload-outline',
      message: getPublishMessage(activities),
      action: async () => {
        try {
          await publish(activities.filter((it) => !it.detached));
          notify(`The ${label} has been published`);
          showPublishSuccess.value = true;
        } catch {
          notify(`We couldn't publish the ${label}`, { color: 'error' });
        }
      },
    });
  };

  const publishRepository = (activities: StoreActivity[]) => {
    const repositoryTypeLabel = currentRepository.schemaName;
    const { name } = currentRepository.repository!;
    confirmationDialog({
      title: `Publish ${repositoryTypeLabel}`,
      icon: 'mdi-cloud-upload-outline',
      message: `Are you sure you want to publish the ${repositoryTypeLabel} "${name}"?`,
      action: async () => {
        try {
          await api.repository.publishMeta({
            params: { repositoryId: currentRepository.repositoryId! },
          });
          await publish(activities.filter((it) => !it.detached));
          notify(`The ${repositoryTypeLabel} has been published`);
          showPublishSuccess.value = true;
        } catch {
          notify(`We couldn't publish the ${repositoryTypeLabel}`, {
            color: 'error',
          });
        }
      },
    });
  };

  return {
    isPublishing,
    showPublishSuccess,
    status,
    publish,
    confirmPublishing,
    publishRepository,
  };
};
