import type {
  ContentElement,
  Relationship,
} from '@tailor-cms/interfaces/content-element';
import type {
  ContentElementCreateReq,
  ContentElementUpdateReq,
} from '@tailor-cms/api-client';
import { ContentElement as Events } from '@tailor-cms/common/src/sse.js';
import { calculatePosition, type PositionConfig } from '@tailor-cms/utils';
import { flatMap, flatten } from 'lodash-es';

import { api } from '@/api';
import sseRepositoryFeed from '@/lib/RepositoryFeed';
import { useEditorStore } from '@/stores/editor';

type Id = number | string;
export type StoreContentElement = ContentElement;
export type FoundContentElement = StoreContentElement | undefined;

export const useContentElementStore = defineStore('contentElements', () => {
  const editorStore = useEditorStore();

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
    const element = $items.get(item.uid) as StoreContentElement;
    if (editorStore.selectedContentElement?.uid === element.uid) {
      editorStore.selectedContentElement = element;
    }
    return element;
  }

  async function fetch(
    repositoryId: number,
    activityIds: number[],
  ): Promise<StoreContentElement[]> {
    const contentElements = await api.contentElement.list({
      params: { repositoryId },
      query: { activityIds },
    });
    // Make sure to fetch all referenced elements
    const ref: Relationship[] = flatMap(contentElements, (v) =>
      flatten(Object.values(v.refs)),
    );
    if (ref.length) {
      const refElements = await api.contentElement.list({
        params: { repositoryId },
        query: {
          activityIds: ref
            .map((it) => it?.containerId)
            .filter((id) => id != null),
        },
      });
      contentElements.push(...refElements);
    }
    $items.clear();
    contentElements.forEach((it) => add(it));
    return items.value;
  }

  type SaveInput =
    | (ContentElementCreateReq['body'] & {
      repositoryId: number;
      id?: undefined;
    })
    | (ContentElementUpdateReq['body'] & {
      id: number;
      repositoryId: number;
    });

  async function save(payload: SaveInput): Promise<StoreContentElement> {
    const { id, repositoryId, ...body } = payload;
    const contentElement = id
      ? await api.contentElement.update({
          params: { repositoryId, elementId: id },
          body: body as ContentElementUpdateReq['body'],
        })
      : await api.contentElement.create({
          params: { repositoryId },
          body: body as ContentElementCreateReq['body'],
        });
    return add(contentElement);
  }

  async function remove(repositoryId: number, id: number): Promise<undefined> {
    const element = findById(id);
    if (!element) throw new Error('Element not found');
    await api.contentElement.delete({
      params: { repositoryId, elementId: id },
    });
    $items.delete(element.uid);
  }

  const reorder = ({
    element,
    context,
  }: {
    element: StoreContentElement;
    context: PositionConfig & { newPosition: number };
  }) => {
    const storeElement = findById(element.id);
    if (!storeElement) throw new Error('Element not found');
    const position = calculatePosition(context);
    storeElement.position = position;
    const { repositoryId, id } = element;
    return api.contentElement
      .reorder({
        params: { repositoryId, elementId: id },
        body: { position: context.newPosition },
      })
      .then((data) => Object.assign(storeElement, data));
  };

  // Unlink element from source, converting to a local copy.
  async function unlink(
    element: StoreContentElement,
  ): Promise<StoreContentElement> {
    const storeElement = findById(element.id);
    if (!storeElement) throw new Error('Element not found');
    const { repositoryId, id } = element;
    const updated = await api.contentElement.unlink({
      params: { repositoryId, elementId: id },
    });
    return add(updated);
  }

  const $subscribeToSSE = () => {
    sseRepositoryFeed
      .subscribe(Events.Create, (it: ContentElement) => add(it))
      .subscribe(Events.Update, (it: ContentElement) => add(it))
      .subscribe(Events.BulkUpdate, (items: ContentElement[]) =>
        items.forEach(add),
      )
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
    unlink,
    $subscribeToSSE,
    $reset,
  };
});
