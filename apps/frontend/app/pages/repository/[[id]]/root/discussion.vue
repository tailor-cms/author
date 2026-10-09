<template>
  <div class="discussion-channel d-flex h-100">
    <div :style="{ width: `${width}px` }" class="rail flex-shrink-0">
      <ThreadRail
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
    <div class="pane flex-grow-1 d-flex flex-column">
      <SearchBar
        :is-searching="messagingStore.isSearching"
        :query="messagingStore.searchQuery"
        :total="messagingStore.searchTotal"
        @clear="messagingStore.clearSearch()"
        @search="searchMessages"
      />
      <VDivider />
      <div class="pane-split d-flex flex-grow-1">
        <SearchResults
          v-if="isSearchActive"
          :current-user-id="currentUserId"
          :hits="messagingStore.searchHits"
          :is-searching="messagingStore.isSearching"
          :query="messagingStore.searchQuery"
          class="pane-body"
          @select="openSearchResult"
        />
        <ThreadPane
          v-else-if="messagingStore.selectedThread"
          :key="messagingStore.selectedThread.id"
          v-model:draft="draft"
          :current-user-id="currentUserId"
          :last-read-at="messagingStore.openedWatermark"
          :messages="messagingStore.messages"
          :thread="messagingStore.selectedThread"
          :typing-users="threadTypingUsers"
          class="pane-body"
          @resolve="setResolved"
          @star="setStarred(messagingStore.selectedThread!.id, $event)"
          @remove:thread="removeThread"
          @open:subscriptions="isSubscribingOpen = true"
          @open:files="isSharedFilesOpen = true"
          @react="reactToMessage"
          @remove="removeMessage"
          @reply="openReplies"
          @submit="postMessage"
          @typing="reportTyping"
          @update="editMessage"
        />
        <StartDiscussion
          v-else
          class="pane-body"
          @create="createThread"
        />
        <template v-if="messagingStore.replyParent">
          <VDivider vertical />
          <div
            :style="{ width: `${replyWidth}px` }"
            class="reply-column flex-shrink-0"
          >
            <ReplyPane
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
import { useDisplay } from 'vuetify';

import { useMessagingStore, type ThreadScope } from '@/stores/messaging';
import ReplyPane from '@/components/repository/Discussion/ReplyPane.vue';
import SearchBar from '@/components/repository/Discussion/Search/SearchBar.vue';
import SearchResults
  from '@/components/repository/Discussion/Search/SearchResults.vue';
import SharedFilesDialog
  from '@/components/repository/Discussion/ThreadPane/SharedFilesDialog.vue';
import StartDiscussion
  from '@/components/repository/Discussion/StartDiscussion.vue';
import SubscriptionsDialog
  from '@/components/repository/Discussion/ThreadPane/SubscriptionsDialog.vue';
import ThreadPane
  from '@/components/repository/Discussion/ThreadPane/index.vue';
import ThreadRail
  from '@/components/repository/Discussion/ThreadRail/index.vue';
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

const currentUserId = computed(() => authStore.user?.id ?? null);
const repositoryId = computed(
  () => currentRepositoryStore.repositoryId as number,
);

const hasIntegrationAccess = computed(
  () => currentRepositoryStore.access.canManageIntegrations,
);

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

const openSearchResult = (threadId: number) => {
  messagingStore.clearSearch();
  openThread(threadId);
};

const createThread = async (payload: { content: string; title: string }) => {
  const thread = await messagingStore.startThread(repositoryId.value, payload);
  openThread(thread.id);
  // Reload rail, since the new thread has no last message yet
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

.rail {
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

.pane {
  position: relative;
  min-width: 0;
  min-height: 0;
}

.pane-split {
  min-width: 0;
  min-height: 0;
}

.pane-body {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

.reply-column {
  position: relative;
  min-width: 0;
  max-width: 50vw;
}
</style>
