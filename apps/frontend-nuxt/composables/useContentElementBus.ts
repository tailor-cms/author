import { getElementId } from '@tailor-cms/utils';

import type { ContentElement } from '@/api/interfaces/content-element';

export const useContentElementBus = (element: ContentElement) => {
  const { $eventBus } = useNuxtApp() as any;
  return $eventBus.channel(`element:${getElementId(element)}`);
};
