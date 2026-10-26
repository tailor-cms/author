<template>
  <VLayout class="discussion-page h-100">
    <VNavigationDrawer
      v-model="isListOpen"
      :class="{ resizing: isResizing }"
      :width="width"
      color="surface-canvas"
      location="left"
      mobile-breakpoint="md"
    >
      <div class="thread-list-column h-100">
        <ThreadList
          v-model:scope="scope"
          v-model:name="nameFilter"
          :has-integration-access="hasIntegrationAccess"
          :is-loading="messagingStore.isLoading"
          :selected-id="routeThreadId ?? messagingStore.selectedThreadId"
          :threads="messagingStore.items"
          :unread="messagingStore.unread"
          @manage:integrations="isIntegrationsOpen = true"
          @clear:unread="markAllRead"
          @select="selectThread"
          @star="setStarred"
          @collapse="isListOpen = false"
          @start:thread="selectThread(null)"
        />
        <div
          aria-orientation="vertical"
          class="resize-handle"
          role="separator"
          @pointerdown="startResize"
        />
      </div>
    </VNavigationDrawer>
    <VFadeTransition>
      <VBtn
        v-if="!isListOpen"
        v-tooltip:right="{ text: 'Open sidebar', openDelay: 500 }"
        aria-label="Open sidebar"
        class="sidebar-toggle"
        color="surface-overlay"
        density="comfortable"
        icon="mdi-format-list-bulleted"
        size="small"
        @click="isListOpen = true"
      />
    </VFadeTransition>
    <VAppBar
      :class="{ 'search-mode': isSearchOpen }"
      border="b"
      class="discussion-toolbar"
      color="surface-canvas"
      height="64"
      order="1"
      flat
    >
      <VFadeTransition leave-absolute>
        <SearchBar
          v-if="isSearchOpen"
          :is-searching="messagingStore.isSearching"
          :query="messagingStore.searchQuery"
          :total="messagingStore.searchTotal"
          autofocus
          @close="closeSearch"
          @search="searchMessages"
        />
        <div v-else class="d-flex align-center ga-1 w-100 h-100 pr-3">
          <ThreadHeader
            v-if="messagingStore.selectedThread"
            :thread="messagingStore.selectedThread"
            class="flex-grow-1"
          />
          <h2
            v-else-if="!routeThreadId"
            class="text-title-medium font-weight-medium flex-grow-1 px-4"
          >
            New thread
          </h2>
          <VSpacer v-else />
          <VBtn
            v-tooltip:bottom="'Search messages (/)'"
            aria-label="Search messages"
            density="comfortable"
            variant="text"
            icon
            @click="isSearchOpen = true"
          >
            <VIcon icon="mdi-magnify" size="small" />
          </VBtn>
          <ThreadMenu
            v-if="messagingStore.selectedThread"
            :is-removable="isThreadRemovable"
            :thread="messagingStore.selectedThread"
            @open:files="isSharedFilesOpen = true"
            @open:subscriptions="isSubscribingOpen = true"
            @remove:thread="removeThread"
            @resolve="setResolved"
            @star="setStarred(messagingStore.selectedThread!.id, $event)"
          />
        </div>
      </VFadeTransition>
    </VAppBar>
    <VNavigationDrawer
      :class="{ resizing: isReplyResizing }"
      :model-value="!!messagingStore.replyParent"
      :width="replyWidth"
      color="surface-sidebar"
      location="right"
      mobile-breakpoint="lg"
      disable-resize-watcher
      disable-route-watcher
      @update:model-value="!$event && messagingStore.closeReplies()"
    >
      <div v-if="messagingStore.replyParent" class="reply-column h-100">
        <ReplyPanel
          :key="messagingStore.replyParent.id"
          :current-user-id="currentUserId"
          :focused-id="messagingStore.focusedReplyId"
          :parent="messagingStore.replyParent"
          :replies="messagingStore.replies"
          class="h-100"
          @close="messagingStore.closeReplies()"
          @react="reactToMessage"
          @remove="removeMessage"
          @submit="postReply"
          @update="editMessage"
        />
        <div
          aria-orientation="vertical"
          class="resize-handle resize-handle--start"
          role="separator"
          @pointerdown="startReplyResize"
        />
      </div>
    </VNavigationDrawer>
    <VMain scrollable>
      <SearchResults
        v-if="isSearchActive"
        :current-user-id="currentUserId"
        :hits="messagingStore.searchHits"
        :is-searching="messagingStore.isSearching"
        :query="messagingStore.searchQuery"
        class="conversation-column py-8"
        @select:hit="openSearchResult"
      />
      <ThreadPanel
        v-else-if="messagingStore.selectedThread"
        :key="messagingStore.selectedThread.id"
        v-model:draft="draft"
        :class="{ 'opacity-70': isThreadSlow }"
        :current-user-id="currentUserId"
        :focused-id="routeMessageId"
        :last-read-at="messagingStore.openedWatermark"
        :messages="messagingStore.messages"
        :thread="messagingStore.selectedThread"
        :typing-users="threadTypingUsers"
        class="h-100"
        @react="reactToMessage"
        @remove="removeMessage"
        @reply="openReplies"
        @submit="postMessage"
        @typing="reportTyping"
        @update="editMessage"
      />
      <div v-else-if="routeThreadId" class="d-flex justify-center py-16">
        <VProgressCircular v-if="isThreadSlow" indeterminate />
      </div>
      <StartDiscussion v-else class="h-100" @create="createThread" />
      <SharedFilesDialog
        v-model="isSharedFilesOpen"
        :repository-id="repositoryId"
        :thread-id="messagingStore.selectedThreadId"
      />
      <IntegrationsDialog
        v-if="hasIntegrationAccess"
        v-model="isIntegrationsOpen"
        :repository-id="repositoryId"
      />
      <SubscriptionsDialog
        v-if="messagingStore.selectedThread"
        v-model="isSubscribingOpen"
        :repository-id="repositoryId"
        :subscriptions="messagingStore.selectedThread.subscriptions ?? []"
        :thread-id="messagingStore.selectedThread.id"
        @saved="onSubscribed"
      />
    </VMain>
  </VLayout>
</template>

<script lang="ts" setup>
import type { MessageSearchHit } from '@tailor-cms/api-client';

import { debounce } from 'lodash-es';
import { onKeyStroke } from '@vueuse/core';
import { useDisplay } from 'vuetify';

import { useMessagingStore, type ThreadScope } from '@/stores/messaging';
import ReplyPanel from '@/components/repository/Discussion/ReplyPanel.vue';
import SearchBar from '@/components/repository/Discussion/Search/SearchBar.vue';
import SearchResults
  from '@/components/repository/Discussion/Search/SearchResults.vue';
import SharedFilesDialog
  from '@/components/repository/Discussion/ThreadPanel/SharedFilesDialog.vue';
import StartDiscussion
  from '@/components/repository/Discussion/StartDiscussion.vue';
import SubscriptionsDialog
  from '@/components/repository/Discussion/ThreadPanel/SubscriptionsDialog.vue';
import ThreadHeader
  from '@/components/repository/Discussion/ThreadPanel/ThreadHeader.vue';
import ThreadMenu
  from '@/components/repository/Discussion/ThreadPanel/ThreadMenu.vue';
import ThreadPanel
  from '@/components/repository/Discussion/ThreadPanel/index.vue';
import ThreadList
  from '@/components/repository/Discussion/ThreadList/index.vue';
import { useThreadDraft }
  from '@/components/repository/Discussion/composables/useThreadDraft';
import { useThreadRoute }
  from '@/components/repository/Discussion/composables/useThreadRoute';
import IntegrationsDialog
  from '@/components/repository/Discussion/IntegrationsDialog/index.vue';
import { useAuthStore } from '@/stores/auth';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({ name: 'discussion' });

const authStore = useAuthStore();
const messagingStore = useMessagingStore();
const currentRepositoryStore = useCurrentRepository();

const notify = useNotification();
const confirmationDialog = useConfirmationDialog();

const isIntegrationsOpen = ref(false);
const isSubscribingOpen = ref(false);
const isSharedFilesOpen = ref(false);
const scope = ref<ThreadScope>('all');
const nameFilter = ref('');

const draft = useThreadDraft(() => messagingStore.selectedThreadId);
const isSearchActive = computed(() => !!messagingStore.searchQuery.trim());
// The toolbar swaps to the search field
const isSearchOpen = ref(false);

const currentUserId = computed(() => authStore.user?.id ?? null);
const repositoryId = computed(
  () => currentRepositoryStore.repositoryId as number,
);

const hasIntegrationAccess = computed(
  () => currentRepositoryStore.access.canManageIntegrations,
);

const isThreadRemovable = computed(() => {
  const thread = messagingStore.selectedThread;
  if (!thread) return false;
  return authStore.isAdmin || thread.createdById === currentUserId.value;
});

const { mdAndUp, lgAndUp } = useDisplay();
const isListOpen = ref(mdAndUp.value);
const { width, isResizing, startResize } = useDrawerResize({
  side: 'left',
  storageKey: 'discussion:rail:width',
  defaultWidth: () => (lgAndUp.value ? 420 : 340),
});

const {
  width: replyWidth,
  isResizing: isReplyResizing,
  startResize: startReplyResize,
} = useDrawerResize({
  side: 'right',
  storageKey: 'discussion:replies:width',
  defaultWidth: 384,
  minWidth: 300,
  maxWidth: 720,
});

const threadTypingUsers = computed(() => {
  if (!messagingStore.selectedThreadId) return [];
  return messagingStore.typingUsers.filter(
    (it: any) => it.id === messagingStore.selectedThreadId,
  );
});

const load = () =>
  messagingStore.fetchThreads(repositoryId.value, {
    scope: scope.value,
    name: nameFilter.value?.trim() || undefined,
  });

const searchMessages = (query: string) =>
  messagingStore.search(repositoryId.value, query);

const { routeThreadId, routeMessageId, openThread, closeThread } =
  useThreadRoute(repositoryId);

// The picked thread shows once its messages are in; a slow load dims the
// current one, or shows a loader when there is none
const isThreadPending = computed(
  () =>
    !!routeThreadId.value &&
    routeThreadId.value !== messagingStore.selectedThreadId,
);
const isThreadSlow = useDelayedLoading(isThreadPending);

const closeSearch = () => {
  isSearchOpen.value = false;
  messagingStore.clearSearch();
};

// From the list or a search result; the results stay until the picked
// thread is on screen, so the previous one doesn't flash in between
const selectThread = (threadId: number | null, messageId?: number) => {
  if (threadId === messagingStore.selectedThreadId) closeSearch();
  openThread(threadId, messageId);
};

// At the message in its thread, or a reply under its parent
const openSearchResult = (hit: MessageSearchHit) => {
  const parentId = hit.isBroadcast ? null : (hit.parentId ?? null);
  selectThread(hit.threadId, parentId ?? hit.id);
  if (parentId) openReplies(parentId, hit.id);
  else messagingStore.closeReplies();
};

watch(() => messagingStore.selectedThreadId, closeSearch);
// A search and its jump are for this visit; coming back starts afresh
onBeforeUnmount(() => {
  messagingStore.clearSearch();
  messagingStore.focusedReplyId = null;
});

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA'].includes(target.tagName));

onKeyStroke('/', (event) => {
  if (isSearchOpen.value || isTyping(event.target)) return;
  event.preventDefault();
  isSearchOpen.value = true;
});

const createThread = async (payload: { content: string; title: string }) => {
  const thread = await messagingStore.startThread(repositoryId.value, payload);
  openThread(thread.id);
  // Reload the list, since the new thread has no last message yet
  await load();
  notify('Thread started');
};

const postMessage = async (content: string) => {
  const threadId = messagingStore.selectedThreadId;
  if (!threadId) return;
  await messagingStore.postMessage(repositoryId.value, threadId, content);
};

// Separate column for replies
const openReplies = (parentId: number, replyId?: number) =>
  messagingStore.openReplies(repositoryId.value, parentId, replyId);

const postReply = async (content: string, isBroadcast: boolean) => {
  const parentId = messagingStore.openReplyParentId;
  if (!parentId) return;
  await messagingStore.postReply(
    repositoryId.value,
    parentId,
    content,
    isBroadcast,
  );
};

const reactToMessage = (id: number, emoji: string) =>
  messagingStore.toggleReaction(repositoryId.value, id, emoji);

const editMessage = async (id: number, content: string) => {
  await messagingStore.saveMessage({
    id,
    content,
    repositoryId: repositoryId.value,
  });
  notify('Message updated');
};

const removeMessage = async (id: number) => {
  await messagingStore.removeMessage(repositoryId.value, id);
  notify('Message deleted');
};

const onSubscribed = (topics: string[]) =>
  notify(
    topics.length
      ? 'Thread will report these updates'
      : 'Thread unsubscribed from updates',
  );

const setResolved = async (resolved: boolean) => {
  const threadId = messagingStore.selectedThreadId;
  if (!threadId) return;
  await messagingStore.setResolved(repositoryId.value, threadId, resolved);
  notify(resolved ? 'Thread resolved' : 'Thread reopened');
};

const setStarred = async (threadId: number, isStarred: boolean) => {
  await messagingStore.setStarred(repositoryId.value, threadId, isStarred);
  if (isStarred) notify('Starred');
};

const removeThread = () => {
  const thread = messagingStore.selectedThread;
  if (!thread) return;
  confirmationDialog({
    title: 'Delete thread',
    color: 'error',
    message:
      `Delete "${thread.title ?? 'this thread'}" and every message in ` +
      'it? This cannot be undone.',
    action: async () => {
      await messagingStore.removeThread(repositoryId.value, thread.id);
      closeThread();
      notify('Thread deleted');
    },
  });
};

const markAllRead = async () => {
  await messagingStore.markAllRead(repositoryId.value);
  notify('Everything marked as read');
};

const reportTyping = debounce(
  () => {
    const threadId = messagingStore.selectedThreadId;
    if (threadId) messagingStore.reportTyping(repositoryId.value, threadId);
  },
  1500,
  { leading: true, trailing: false },
);

watch(scope, load);
watch(nameFilter, debounce(load, 300));

onMounted(async () => {
  await Promise.all([load(), messagingStore.fetchUnread(repositoryId.value)]);
});
</script>

<style lang="scss" scoped>
.discussion-page {
  text-align: left;

  // Suppress the drawer's width animation while dragging its handle
  .resizing {
    transition-duration: 0s !important;
  }
}

.thread-list-column,
.reply-column {
  position: relative;
  min-width: 0;
}

// Reopens the collapsed thread list, like the editor's sidebar toggle
.sidebar-toggle {
  position: absolute;
  // Above the scrollable VMain, which covers the whole layout
  z-index: 1;
  top: 6rem;
  left: 0;
  width: 1.5rem;
  height: 3.5rem;
  border-radius: 0 12px 12px 0;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  width: 0.3125rem;
  cursor: col-resize;
  touch-action: none;

  &:hover,
  &:active {
    background: rgba(var(--v-theme-primary), 0.25);
  }
}

.resize-handle--start {
  right: auto;
  left: 0;
}

.discussion-toolbar {
  // The editor toolbar's wash for a temporary mode (history, diff)
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: rgb(var(--v-theme-surface-container-highest));
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &.search-mode {
    border-bottom-color: rgb(var(--v-theme-outline-variant));

    &::before {
      opacity: 1;
    }
  }

  :deep(.v-toolbar__content) {
    padding: 0;
  }
}

// Same max width as the other repository pages
.conversation-column {
  max-width: 87.5rem;
  margin-inline: auto;
  padding-inline: 2rem;
}
</style>
