import type {
  CustomEmoji,
  SuggestionFetcher,
  UploadedFile,
} from './types';
import type { Component, Ref } from 'vue';
import type { ReferenceToken } from '@tailor-cms/utils';

import { computed, inject, provide, ref } from 'vue';

// Autocomplete and uploads for the composer
export interface DiscussionServices {
  suggestUsers: SuggestionFetcher;
  suggestReferences: SuggestionFetcher;
  uploadFiles: (files: File[]) => Promise<UploadedFile[]>;
}

export interface ReferenceChipProps {
  token: ReferenceToken;
  icon: string;
}

export interface ReferenceViews {
  // The inline link for a `#` reference
  chip: Component<ReferenceChipProps>;
  // Cards and images under a message, with the text in its slot
  previews: Component;
}

export interface CustomEmojiSource {
  get: (name: string) => CustomEmoji | undefined;
  search: (query: string, limit?: number) => CustomEmoji[];
}

/**
 * What the app supplies to discussions (API).
 */
export interface DiscussionContext {
  services?: DiscussionServices;
  referenceViews?: ReferenceViews;
  customEmoji?: CustomEmojiSource;
}

const DISCUSSION_CONTEXT = '$discussionContext';
const EDITING_MESSAGE = '$editingMessage';

export const provideDiscussionContext = (context: DiscussionContext) =>
  provide(DISCUSSION_CONTEXT, context);

export const useDiscussionContext = (): DiscussionContext =>
  inject<DiscussionContext>(DISCUSSION_CONTEXT, {});

/**
 * Which message in a pane is being edited, as a uid shared with every
 * row below.
 */
export const provideEditingMessage = () => {
  const editingUid = ref<string | null>(null);
  provide(EDITING_MESSAGE, editingUid);
  return editingUid;
};

export const useEditingMessage = (uid: () => string) => {
  const editingUid = inject<Ref<string | null>>(EDITING_MESSAGE, ref(null));
  return computed({
    get: () => editingUid.value === uid(),
    set: (value: boolean) => {
      editingUid.value = value ? uid() : null;
    },
  });
};
