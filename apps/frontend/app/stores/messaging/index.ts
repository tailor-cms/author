import type { Thread } from './threads';
import type { Message } from '@tailor-cms/interfaces/comment';

import {
  Comment as CommentEvents,
  Thread as ThreadEvents,
} from '@tailor-cms/common/src/sse.js';
import { extractMentions } from '@tailor-cms/utils';
import { createComments, isContentComment } from './comments';
import { createMessageCache } from './messageCache';
import { createReplies } from './replies';
import { createSearch } from './search';
import { createThreads } from './threads';
import { createTypingIndicator } from './typing';
import { createUnread } from './unread';
import { useAuthStore } from '@/stores/auth';
import sseRepositoryFeed from '@/lib/RepositoryFeed';

export type { ThreadScope } from '@tailor-cms/interfaces/comment';

export const useMessagingStore = defineStore('messaging', () => {
  const authStore = useAuthStore();
  const notify = useNotification();

  const messageCache = createMessageCache();
  const comments = createComments(messageCache);
  const replies = createReplies(messageCache);
  const unread = createUnread();
  const threads = createThreads(messageCache, replies, unread);
  const search = createSearch();
  const typing = createTypingIndicator();

  // Announce a new message to the user if it mentions them
  function announce(message: Message) {
    const me = authStore.user?.id;
    if (!me || message.authorId === me) return;
    if (message.repositoryId) unread.refreshUnread(message.repositoryId);
    // Already looking at it: the message itself is the notification.
    const { threadId } = message;
    if (threadId && threadId === threads.selectedThreadId.value) return;
    const mentionsMe = extractMentions(message.content ?? '').some(
      (it) => it.userId === me,
    );
    if (!mentionsMe) return;
    const who = message.author?.label ?? message.integration?.name;
    notify(`${who ?? 'Someone'} mentioned you in a thread`, {
      color: 'secondary',
    });
  }

  function onMessageCreated(message: Message) {
    if (threads.hasLoadedMessages(message.threadId)) {
      threads.addToThread(message, { isNew: true });
    } else if (isContentComment(message)) {
      messageCache.setLocal(message);
    }
    threads.updateThreadSummary(message);
    announce(message);
  }

  const onMessageChanged = (message: Message) =>
    messageCache.mergeLocal(message.id, message);

  const $subscribeToSSE = () => {
    sseRepositoryFeed
      .subscribe(CommentEvents.Create, onMessageCreated)
      .subscribe(CommentEvents.Update, onMessageChanged)
      .subscribe(CommentEvents.Delete, onMessageChanged)
      .subscribe(ThreadEvents.Create, threads.addThread)
      .subscribe(ThreadEvents.Update, threads.addThread)
      .subscribe(ThreadEvents.Delete, (it: Thread) =>
        threads.dropThread(it.id),
      )
      .subscribe(ThreadEvents.Typing, (it: any) => {
        if (it.user?.id !== authStore.user?.id) typing.onTyping(it);
      });
  };

  function $reset() {
    messageCache.clear();
    replies.clear();
    threads.clear();
    unread.clear();
    typing.clear();
  }

  return {
    // Messages, wherever they are shown
    saveMessage: messageCache.save,
    removeMessage: messageCache.remove,
    toggleReaction: messageCache.toggleReaction,
    // Comments on content, for the editor
    ...comments,
    // Threads
    items: threads.items,
    threads: threads.threads,
    messages: threads.selectedThreadMessages,
    selectedThread: threads.selectedThread,
    selectedThreadId: threads.selectedThreadId,
    openedWatermark: threads.openedWatermark,
    isLoading: threads.isLoading,
    total: threads.total,
    fetchThreads: threads.fetchThreads,
    selectThread: threads.selectThread,
    deselectThread: threads.deselectThread,
    startThread: threads.startThread,
    postMessage: threads.postMessage,
    setResolved: threads.setResolved,
    setStarred: threads.setStarred,
    fetchSubscriptionTopics: threads.fetchSubscriptionTopics,
    setSubscriptions: threads.setSubscriptions,
    listAssets: threads.listAssets,
    removeThread: threads.removeThread,
    markRead: threads.markRead,
    markAllRead: threads.markAllRead,
    // Replies
    replies: replies.replies,
    replyParent: replies.replyParent,
    openReplyParentId: replies.openReplyParentId,
    openReplies: replies.openReplies,
    closeReplies: replies.closeReplies,
    postReply: threads.postReply,
    // Unread counts
    unread: unread.counts,
    fetchUnread: unread.fetchUnread,
    // Search
    ...search,
    // Typing
    typingUsers: typing.typingUsers,
    reportTyping: typing.reportTyping,
    $subscribeToSSE,
    $reset,
  };
});
