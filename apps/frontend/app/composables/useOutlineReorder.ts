import type { SortableEvent } from 'sortablejs';

import { useActivityStore } from '@/stores/activity';

export const useOutlineReorder =
  () =>
    ({ newIndex: newPosition }: SortableEvent, items: any[]) => {
      const activityStore = useActivityStore();
      const activity = items[newPosition];
      const context = { items, newPosition };
      return activityStore.reorder(activity, context);
    };
