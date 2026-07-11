import type { Repository } from '@tailor-cms/interfaces/repository';

import { schema as schemaApi } from '@tailor-cms/config';
import Promise from 'bluebird';

import { api } from '@/api';

const initialStatus = () => ({ progress: 0, message: '' });

/**
 * Publishes a repository's full content from the catalog, where the activity
 * outline isn't loaded. Mirrors the rail's flow (usePublishActivity): republish
 * the catalog manifest, then publish every activity. `api.activity.list`
 * already excludes detached activities, so the fetched list is publishable
 * as-is.
 */
export const useCatalogPublish = () => {
  const confirmationDialog = useConfirmationDialog();
  const notify = useNotification();

  const status = ref(initialStatus());
  const isPublishing = computed(() => status.value.progress > 0);

  const publish = async (repositoryId: number) => {
    await api.repository.publishMeta({ params: { repositoryId } });
    const activities = await api.activity.list({ params: { repositoryId } });
    return Promise.each(activities, (activity: any, i: number) => {
      status.value = {
        progress: (i + 1) / activities.length,
        message: `Publishing ${activity.data.name}`,
      };
      return api.activity.publish({
        params: { repositoryId, activityId: activity.id },
      });
    }).finally(() => (status.value = initialStatus()));
  };

  const publishRepository = (repository: Repository, onDone?: () => unknown) => {
    const repositoryTypeName = schemaApi.getSchema(repository.schema).name;
    const message =
      `Are you sure you want to publish all content in ${repository.name}?`;
    confirmationDialog({
      title: 'Publish content',
      message,
      action: async () => {
        try {
          await publish(repository.id);
          await onDone?.();
          notify(`The ${repositoryTypeName} has been published`, { immediate: true });
        } catch {
          notify(`We couldn't publish the ${repositoryTypeName}`, { color: 'error' });
        }
      },
    });
  };

  return { isPublishing, status, publishRepository };
};
