import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { getElementId } from '@tailor-cms/utils';

export const useContentElementBus = (element: ContentElement) => {
  const { $eventBus } = useNuxtApp() as any;
  return $eventBus.channel(`element:${getElementId(element)}`);
};
