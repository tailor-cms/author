import { useActivityStore } from '@/stores/activity';
import { useNotification } from '@/composables/useNotification';

export function useStatusUpdate() {
  const activityStore = useActivityStore();
  const notify = useNotification();
  return async (activity: StoreActivity, key: string, value: any = null) => {
    await activityStore.saveStatus(activity.id, { [key]: value });
    return notify('Status saved');
  };
}
