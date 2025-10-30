import { useActivityStore } from '@/stores/activity';
import type { DraggableUpdateEvent } from '@/lib/vue-dragggable';

export const useOutlineReorder =
  () =>
    ({ newIndex: newPosition }: DraggableUpdateEvent, items: any[]) => {
      const activityStore = useActivityStore();
      const activity = items[newPosition];
      const context = { items, newPosition };
      return activityStore.reorder(activity, context);
    };
