import { calculatePosition } from '@tailor-cms/utils';

import { contentElement as api } from '@/api';

export type Id = number | string;
export type StoreContentElement = any;
export type FoundContentElement = StoreContentElement | undefined;

export const useContentElementStore = defineStore('contentElements', () => {
  const $items = reactive(new Map<string, StoreContentElement>());
  const items = computed(() => Array.from($items.values()));

  function findById(id: Id): FoundContentElement {
    if (typeof id === 'string') return $items.get(id);
    return items.value.find((it: StoreActivity) => it.id === id);
  }

  function where(
    predicate: (activity: StoreContentElement) => boolean,
  ): StoreContentElement[] {
    return items.value.filter(predicate);
  }

  function add(item: StoreContentElement): StoreContentElement {
    $items.set(item.uid, item);
    return $items.get(item.uid);
  }

  async function fetch(
    repositoryId: number,
    activityIds: number[],
  ): Promise<StoreContentElement[]> {
    const params = { ids: activityIds };
    const contentElements: StoreContentElement[] = await api.fetch(
      repositoryId,
      params,
    );
    $items.clear();
    contentElements.forEach((it) => add(it));
    return items.value;
  }

  async function save(payload: any): Promise<StoreContentElement> {
    const { id, repositoryId, ...rest } = payload;
    const contentElement = await (id
      ? api.patch(repositoryId, id, rest)
      : api.create(payload));
    add(contentElement);
    return $items.get(contentElement.uid);
  }

  async function remove(repositoryId: number, id: number): Promise<undefined> {
    const element = findById(id);
    if (!element) throw new Error('Element not found');
    await api.remove(repositoryId, id);
    $items.delete(element.uid);
  }

  const reorder = ({
    element,
    context,
  }: {
    element: StoreContentElement;
    context: any;
  }) => {
    const storeElement = findById(element.id);
    if (!storeElement) throw new Error('Element not found');
    const position = calculatePosition(context);
    storeElement.position = position;
    const { repositoryId, id } = element;
    return api
      .reorder(repositoryId, id, { position: context.newPosition })
      .then((data) => Object.assign(storeElement, data));
  };

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
    save,
    remove,
    reorder,
    $reset,
  };
});
