<template>
  <div class="discussion-channel d-flex h-100">
    <div
      :style="{ width: `${width}px` }"
      class="thread-list-column flex-shrink-0"
    >
      <ThreadList
        v-model:scope="scope"
        v-model:name="nameFilter"
        :has-integration-access="hasIntegrationAccess"
        :is-loading="messagingStore.isLoading"
        :selected-id="messagingStore.selectedThreadId"
        :threads="messagingStore.items"
        :unread="messagingStore.unread"
        @manage:integrations="isIntegrationsOpen = true"
        @clear:unread="markAllRead"
        @select="openThread"
        @star="setStarred"
        @start:thread="openThread(null)"
      />
      <div
        aria-orientation="vertical"
        class="resize-handle"
        role="separator"
        @pointerdown="startResize"
      />
    </div>
    <VDivider vertical />
    <div class="panel flex-grow-1 d-flex flex-column">
      <VSlideYTransition leave-absolute>
        <div v-if="isSearchVisible" class="search-row">
          <SearchBar
            :is-searching="messagingStore.isSearching"
            :query="messagingStore.searchQuery"
            :total="messagingStore.searchTotal"
            @close="closeSearch"
            @search="searchMessages"
          />
          <VDivider />
        </div>
      </VSlideYTransition>
      <div class="panel-split d-flex flex-grow-1">
        <SearchResults
          v-if="isSearchActive"
          :current-user-id="currentUserId"
          :hits="messagingStore.searchHits"
          :is-searching="messagingStore.isSearching"
          :query="messagingStore.searchQuery"
          class="panel-body"
          @select="openSearchResult"
        />
        <ThreadPanel
          v-else-if="messagingStore.selectedThread"
          :key="messagingStore.selectedThread.id"
          v-model:draft="draft"
          :current-user-id="currentUserId"
          :has-header="!isSearchVisible"
          :is-removable="isThreadRemovable"
          :last-read-at="messagingStore.openedWatermark"
          :messages="messagingStore.messages"
          :thread="messagingStore.selectedThread"
          :typing-users="threadTypingUsers"
          class="panel-body"
          @resolve="setResolved"
          @star="setStarred(messagingStore.selectedThread!.id, $event)"
          @remove:thread="removeThread"
          @open:subscriptions="isSubscribingOpen = true"
          @open:files="isSharedFilesOpen = true"
          @open:search="isSearchOpen = true"
          @react="reactToMessage"
          @remove="removeMessage"
          @reply="openReplies"
          @submit="postMessage"
          @typing="reportTyping"
          @update="editMessage"
        />
        <template v-else>
          <StartDiscussion class="panel-body" @create="createThread" />
          <VBtn
            v-if="!isSearchVisible"
            v-tooltip:bottom="'Search messages'"
            aria-label="Search messages"
            class="start-search-btn"
            density="comfortable"
            icon="mdi-magnify"
            size="small"
            variant="text"
            @click="isSearchOpen = true"
          />
        </template>
        <template v-if="messagingStore.replyParent">
          <VDivider vertical />
          <div
            :style="{ width: `${replyWidth}px` }"
            class="reply-column flex-shrink-0"
          >
            <ReplyPanel
              :current-user-id="currentUserId"
              :parent="messagingStore.replyParent"
              :replies="messagingStore.replies"
              :thread-label="replyThreadLabel"
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
        </template>
      </div>
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
    </div>
  </div>
</template>

<script lang="ts" setup>
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
// The search bar replaces the thread header until closed
const isSearchOpen = ref(false);
const isSearchVisible = computed(
  () => isSearchOpen.value || isSearchActive.value,
);

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

const { lgAndUp } = useDisplay();
const { width, startResize } = useDrawerResize({
  side: 'left',
  storageKey: 'discussion:rail:width',
  defaultWidth: () => (lgAndUp.value ? 420 : 340),
});

const { width: replyWidth, startResize: startReplyResize } = useDrawerResize({
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

const replyThreadLabel = computed(
  () => messagingStore.selectedThread?.title ?? 'the thread',
);

const load = () =>
  messagingStore.fetchThreads(repositoryId.value, {
    scope: scope.value,
    name: nameFilter.value?.trim() || undefined,
  });

const searchMessages = (query: string) =>
  messagingStore.search(repositoryId.value, query);

const { openThread, closeThread } = useThreadRoute(repositoryId);

const closeSearch = () => {
  isSearchOpen.value = false;
  messagingStore.clearSearch();
};

const openSearchResult = (threadId: number) => {
  closeSearch();
  openThread(threadId);
};

const isTyping = (el: Element | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ['INPUT', 'TEXTAREA'].includes(el.tagName));

onKeyStroke('/', (event) => {
  if (isSearchVisible.value || isTyping(document.activeElement)) return;
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
const openReplies = (messageId: number) =>
  messagingStore.openReplies(repositoryId.value, messageId);

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
.discussion-channel {
  min-height: 0;
  overflow: hidden;
  text-align: left;
}

.thread-list-column {
  position: relative;
  min-width: 0;
  max-width: 50vw;
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

.panel {
  position: relative;
  min-width: 0;
  min-height: 0;
}

.panel-split {
  position: relative;
  min-width: 0;
  min-height: 0;
}

.panel-body {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

// Leaves pinned over the returning thread header
.search-row {
  z-index: 1;
}

.start-search-btn {
  position: absolute;
  top: 0.75rem;
  right: 1.25rem;
}

.reply-column {
  position: relative;
  min-width: 0;
  max-width: 50vw;
}
</style>
