import type { SortableEvent } from '@/types/draggable';
import { useActivityStore } from '@/stores/activity';

export const useOutlineReorder =
  () =>
    ({ newIndex }: SortableEvent, items: any[]) => {
      if (newIndex === undefined) return;
      const activityStore = useActivityStore();
      const activity = items[newIndex];
      const context = { items, newPosition: newIndex };
      return activityStore.reorder(activity, context);
    };
