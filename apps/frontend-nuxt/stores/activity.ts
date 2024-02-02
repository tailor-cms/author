import type { Activity } from '@/api/interfaces/activity';

import { activity as api } from '@/api';

export const useActivityStore = defineStore('activities', () => {
  const $items = reactive(new Map<string, Activity>());
  const items = computed(() => Array.from($items.values()));

  function findById(id: number | string) {
    if (typeof id === 'string') return $items.get(id);
    return items.value.find((it: Activity) => it.id === id);
  }

  function where(predicate: (activity: Activity) => boolean) {
    return items.value.filter(predicate);
  }

  function add(item: Activity) {
    $items.set(item.uid, item);
    return item;
  }

  async function fetch(repositoryId: number): Promise<Activity[]> {
    const activities: Activity[] = await api.getActivities(repositoryId);
    $items.clear();
    activities.forEach((it) => add(it));
    return activities;
  }

  function $reset() {
    $items.clear();
  }

  return {
    $items,
    items,
    findById,
    where,
    add,
    fetch,
    $reset,
  };
});
