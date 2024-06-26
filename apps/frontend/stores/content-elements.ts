import { calculatePosition } from '@tailor-cms/utils';
import type { ContentElement } from 'tailor-interfaces/content-element';
import { ContentElement as Events } from 'sse-event-types';
import flatMap from 'lodash/flatMap';
import flatten from 'lodash/flatten';

import { contentElement as api } from '@/api';
import sseRepositoryFeed from '@/lib/RepositoryFeed';

type Id = number | string;
export type StoreContentElement = ContentElement;
export type FoundContentElement = StoreContentElement | undefined;

export const useContentElementStore = defineStore('contentElements', () => {
  const $items = reactive(new Map<string, StoreContentElement>());
  const items = computed(() => Array.from($items.values()));

  function findById(id: Id): FoundContentElement {
    if (typeof id === 'string') return $items.get(id);
    return items.value.find((it: StoreContentElement) => it.id === id);
  }

  function where(
    predicate: (activity: StoreContentElement) => boolean,
  ): StoreContentElement[] {
    return items.value.filter(predicate);
  }

  function add(item: ContentElement): StoreContentElement {
    $items.set(item.uid, item);
    return $items.get(item.uid) as StoreContentElement;
  }

  async function fetch(
    repositoryId: number,
    activityIds: number[],
  ): Promise<StoreContentElement[]> {
    const params = { ids: activityIds };
    const contentElements: ContentElement[] = await api.fetch(
      repositoryId,
      params,
    );
    // Make sure to fetch all referenced elements
    const ref = flatMap(contentElements, (v) => flatten(Object.values(v.refs)));
    if (ref.length) {
      const opts = { ids: ref.map((it: any) => it.containerId) };
      const refElements = await api.fetch(repositoryId, opts);
      contentElements.push(...refElements);
    }
    $items.clear();
    contentElements.forEach((it) => add(it));
    return items.value;
  }

  async function save(payload: any): Promise<StoreContentElement> {
    const { id, repositoryId, ...rest } = payload;
    const contentElement = await (id
      ? api.patch(repositoryId, id, rest)
      : api.create(payload));
    return add(contentElement);
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
    const position = calculatePosition(context) as number;
    storeElement.position = position;
    const { repositoryId, id } = element;
    return api
      .reorder(repositoryId, id, { position: context.newPosition })
      .then((data) => Object.assign(storeElement, data));
  };

  const $subscribeToSSE = () => {
    sseRepositoryFeed
      .subscribe(Events.Create, (it: ContentElement) => add(it))
      .subscribe(Events.Update, (it: ContentElement) => add(it))
      .subscribe(Events.Delete, (it: ContentElement) => $items.delete(it.uid));
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
    $subscribeToSSE,
    $reset,
  };
});
