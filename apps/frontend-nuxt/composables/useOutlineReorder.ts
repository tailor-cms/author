import { useActivityStore } from '@/stores/activity';

export const useOutlineReorder =
  () =>
  ({ newIndex: newPosition }: { newIndex: number }, items: any[]) => {
    const activityStore = useActivityStore();
    const activity = items[newPosition];
    const context = { items, newPosition };
    return activityStore.reorder(activity, context);
  };
