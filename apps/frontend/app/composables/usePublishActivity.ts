import type { StoreActivity } from '@/stores/activity';

import { schema as schemaApi } from '@tailor-cms/config';
import Promise from 'bluebird';
import pluralize from 'pluralize-esm';

import { api } from '@/api';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

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
    return Promise.each(activities, (activity: StoreActivity, i: number) => {
      const progress = (i + 1) / activities.length;
      const message = `Publishing ${activity.data.name}`;
      status.value = { progress, message };
      return activityStore.publish(activity);
    }).finally(() => (status.value = initialStatus()));
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
          notify(`The ${label} has been published`, { immediate: true });
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
          notify(`The ${repositoryTypeLabel} has been published`, {
            immediate: true,
          });
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
    status,
    publish,
    confirmPublishing,
    publishRepository,
  };
};
