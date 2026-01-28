import type { ContentElement } from '@tailor-cms/interfaces/content-element';

import contentElementAPI from '@/api/contentElement';
import { useActivityStore } from '@/stores/activity';
import { useContentElementStore } from '@/stores/content-elements';
import { useCurrentRepository } from '@/stores/current-repository';

// NOTE: Intentionally not using nuxt routing to force a full reload
const navigateToElement = (
  repositoryId: number,
  activityId: number,
  elementUid?: string,
) => {
  if (!repositoryId || !activityId) return;
  let url = `/repository/${repositoryId}/editor/${activityId}`;
  if (elementUid) url += `?elementId=${elementUid}`;
  window.location.href = url;
};

export const useContentLinking = (editorChannel: any) => {
  const repositoryStore = useCurrentRepository();
  const activityStore = useActivityStore();
  const contentElementStore = useContentElementStore();
  const notify = useNotification();

  // Check if element is linked via its parent activity
  // (nested link vs direct link)
  editorChannel.on(
    'element:isLinkedViaParent',
    ({
      element,
      callback,
    }: {
      element: ContentElement;
      callback: (isLinked: boolean) => void;
    }) => {
      if (!element.activityId) return callback(false);
      const activity = activityStore.findById(element.activityId);
      callback(activity?.isLinkedCopy ?? false);
    },
  );

  // Fetch source info for a linked copy ("who is my source?")
  editorChannel.on(
    'element:fetchSource',
    async ({
      element,
      callback,
    }: {
      element: ContentElement;
      callback: (sourceInfo: unknown) => void;
    }) => {
      if (!element.isLinkedCopy || !element.sourceId) return callback(null);
      try {
        const sourceInfo = await contentElementAPI.getSource(
          element.repositoryId ?? repositoryStore.repositoryId,
          element.id,
        );
        callback(sourceInfo);
      } catch {
        callback(null);
      }
    },
  );

  // Fetch all linked copies of a source element ("who are my copies?")
  editorChannel.on(
    'element:fetchCopies',
    async ({
      element,
      callback,
    }: {
      element: ContentElement;
      callback: (copiesData: unknown) => void;
    }) => {
      try {
        const copiesData = await contentElementAPI.getCopies(
          element.repositoryId ?? repositoryStore.repositoryId,
          element.id,
        );
        callback(copiesData);
      } catch {
        callback(null);
      }
    },
  );

  // Navigate to an element (source or copy)
  editorChannel.on(
    'element:navigate',
    (payload: {
      repositoryId: number;
      outlineActivityId: number;
      uid?: string;
    }) => {
      const { repositoryId, outlineActivityId, uid } = payload;
      navigateToElement(repositoryId, outlineActivityId, uid);
    },
  );

  // Unlink element from its source; convert to local copy
  editorChannel.on('element:unlink', async (element: ContentElement) => {
    await contentElementStore.unlink(element);
    notify('Element unlinked');
  });
};
