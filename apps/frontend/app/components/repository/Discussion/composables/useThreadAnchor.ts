import type { MaybeRefOrGetter } from 'vue';
import type { ThreadRef } from '@tailor-cms/api-client';

import { ReferenceType, ThreadType } from '@tailor-cms/interfaces/comment';
import { referenceIcon } from '@tailor-cms/core-components';

import { activityHref, elementHref } from '@/utils/entityLinks';
import { useCurrentRepository } from '@/stores/current-repository';

export interface ThreadAnchor {
  icon: string;
  // What the thread is about, e.g. "History of Pizza › Image"
  label: string;
  // Opens that content in the editor
  href?: string;
}

type AnchorOf = (thread: ThreadRef) => ThreadAnchor;

const DEFAULT_LABEL = 'Discussion';
const NO_THREAD: ThreadAnchor = {
  icon: 'mdi-forum-outline',
  label: DEFAULT_LABEL,
};

/**
 * Names threads by the content they hang off.
 */
export const useThreadAnchors = () => {
  const { $ceRegistry, $schemaService } = useNuxtApp() as any;

  const repoStore = useCurrentRepository();
  const { getActivityName } = useActivityName();

  const activityName = ({ activity }: ThreadRef): string | undefined => {
    if (!activity) return undefined;
    return (
      getActivityName(activity) ||
      $schemaService.getLevel(activity.type)?.label
    );
  };

  const channelAnchor: AnchorOf = ({ title }) => ({
    icon: 'mdi-pound',
    label: title || DEFAULT_LABEL,
  });

  const activityAnchor: AnchorOf = (thread) => {
    const { repositoryId } = repoStore;
    const { activityId } = thread;
    return {
      icon: referenceIcon(ReferenceType.Activity),
      label: activityName(thread) ?? DEFAULT_LABEL,
      href:
        repositoryId && activityId
          ? activityHref(repositoryId, activityId)
          : undefined,
    };
  };

  const elementAnchor: AnchorOf = (thread) => {
    const { repositoryId } = repoStore;
    const { activityId, contentElement } = thread;
    const manifest = contentElement && $ceRegistry.get(contentElement.type);
    const name = manifest?.name ?? contentElement?.type ?? 'Element';
    const location = activityName(thread);
    const isLinkable = repositoryId && activityId && contentElement;
    return {
      icon: manifest?.ui?.icon ?? referenceIcon(ReferenceType.Element),
      label: location ? `${location} › ${name}` : name,
      href: isLinkable
        ? elementHref(repositoryId, activityId, contentElement.uid)
        : undefined,
    };
  };

  const anchors: Record<ThreadType, AnchorOf> = {
    [ThreadType.Repository]: channelAnchor,
    [ThreadType.Activity]: activityAnchor,
    [ThreadType.Element]: elementAnchor,
  };

  const anchorOf = (thread?: ThreadRef | null): ThreadAnchor =>
    thread ? anchors[thread.type](thread) : NO_THREAD;

  return { anchorOf };
};

export const useThreadAnchor = (
  thread: MaybeRefOrGetter<ThreadRef | null | undefined>,
) => {
  const { anchorOf } = useThreadAnchors();
  return computed(() => anchorOf(toValue(thread)));
};
