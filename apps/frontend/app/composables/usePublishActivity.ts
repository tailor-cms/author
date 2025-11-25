import Promise from 'bluebird';

import { repository as api } from '@/api';
import type { StoreActivity } from '@/stores/activity';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

const initialStatus = () => ({ progress: 0, message: '' });
const prefix = (msg: string) => `Are you sure you want to publish ${msg}`;

export const usePublishActivity = (anchorActivity?: StoreActivity) => {
  const currentRepository = useCurrentRepository();
  const activityStore = useActivityStore();
  const confirmationDialog = useConfirmationDialog();

  const status = ref(initialStatus());
  const isPublishing = computed(() => status.value.progress > 0);

  const getPublishMessage = (items: StoreActivity[]) => {
    const activityCount = items.length;
    const totalActivities = currentRepository.outlineActivities.length;
    if (activityCount === 1) return prefix(`${items[0].data.name} activity?`);
    if (activityCount === totalActivities) return prefix('all activities?');
    return prefix(`${anchorActivity?.data.name} and all its descendants?`);
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
    confirmationDialog({
      title: 'Publish content',
      message: getPublishMessage(activities),
      action: () => publish(activities.filter((it) => !it.detached)),
    });
  };

  const publishRepository = (activities: StoreActivity[]) => {
    confirmationDialog({
      title: 'Publish content',
      message: getPublishMessage(activities),
      action: async () => {
        await api.publishRepositoryMeta(currentRepository.repositoryId);
        await publish(activities.filter((it) => !it.detached));
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
