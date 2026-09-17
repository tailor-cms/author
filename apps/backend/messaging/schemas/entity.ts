import { CommentType, ThreadType } from '@tailor-cms/interfaces/comment.ts';
import {
  Int,
  IntParam,
  RepositoryScopedParams,
  Timestamp,
  UInt,
  Uid,
  timestamps,
} from '#shared/request/schemas.ts';
import { UserSummary } from '#app/user/schemas/entity.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

// Re-exported for convenience
export { CommentType };

export const MessageItemParams = RepositoryScopedParams.extend({
  messageId: IntParam().describe('Numeric message id (path param).'),
});

export type MessageItemParams = z.infer<typeof MessageItemParams>;

export const CommentElementRef = z
  .object({
    uid: Uid('Content-element UID identifier.'),
    type: z.string().describe('Content-element type id.'),
  })
  .meta({ id: 'CommentElementRef' })
  .describe('The element a comment is pinned to.');

export type CommentElementRef = z.infer<typeof CommentElementRef>;

// The integration slice extends this into its full entity.
export const IntegrationRef = z
  .object({
    id: Int(),
    key: z.string().describe(oneLine`
      Stable identifier; the address a thread subscribes to as
      \`integration:<key>\`.
    `),
    name: z.string(),
    icon: z.string().nullable().describe('MDI icon name.'),
  })
  .meta({ id: 'IntegrationRef' })
  .describe('Slim projection of a non-human posting identity.');

export type IntegrationRef = z.infer<typeof IntegrationRef>;

export const INTEGRATION_SUMMARY_ATTRS = [
  'id',
  'key',
  'name',
  'icon',
  'type',
] as const;

export const Reaction = z
  .object({
    emoji: z.string().describe('The emoji character.'),
    userId: Int().describe('Who reacted.'),
  })
  .meta({ id: 'CommentReaction' })
  .describe('One reader reaction to a comment.');

export type Reaction = z.infer<typeof Reaction>;

// Only on the content entity
export const Comment = z
  .object({
    id: Int(),
    uid: Uid('UID identifier; persists across clones / imports.'),
    repositoryId: Int(),
    threadId: Int().nullable().describe(oneLine`
      Thread it belongs to. An activity or element has a single thread;
      a repository-level one is opened on its own.
    `),
    activityId: Int().nullable().describe(oneLine`
      Activity the comment is on. Cleared when the parent element is
      removed, so it drops out of the activity's thread.
    `),
    contentElementId: Int().nullable().describe(oneLine`
      Element the comment is pinned to; null when it sits on the
      activity itself.
    `),
    authorId: Int(),
    author: UserSummary,
    type: z.enum(CommentType).describe(oneLine`
      \`USER\` for a person, \`INTEGRATION\` for a non-human post.
    `),
    contentElement: CommentElementRef.nullable(),
    content: z.string().min(1).max(2000).describe(oneLine`
      The text. A deleted comment reads "This comment has been deleted";
      \`deletedAt\` is what actually says so.
    `),
    resolvedAt: Timestamp('When it was resolved; null while open.').nullable(),
    editedAt: Timestamp('When it was last edited; null if never.').nullable(),
    reactions: z.array(Reaction),
    ...timestamps(),
  })
  .meta({ id: 'Comment' })
  .describe('A comment on an activity, or inline on a content element.');

export type Comment = z.infer<typeof Comment>;

// Superset of the comment, with subthread & integration support
export const Message = Comment.extend({
  parentId: Int().nullable().optional().describe(oneLine`
    Message this replies to. Replies are one level deep, so a message
    with a parent never has replies of its own.
  `),
  authorId: Int().nullable().describe('Null when an integration posted.'),
  author: UserSummary.nullable(),
  integrationId: Int().nullable().optional(),
  integration: IntegrationRef.nullable().optional(),
  actorId: Int().nullable().optional().describe(oneLine`
    The person an integration post is about - "Jane published the
    course". The post itself has no author.
  `),
  actor: UserSummary.nullable().optional(),
  isBroadcast: z.boolean().optional().describe(oneLine`
    A reply its author also sent to the thread itself, so it shows in
    the transcript as well as under its parent.
  `),
  senderName: z.string().nullable().optional().describe(oneLine`
    What this one post calls itself, when the webhook payload asked for
    a name of its own. Null means it shows the integration's own name.
  `),
  senderEmoji: z.string().nullable().optional().describe(oneLine`
    Emoji shortcode, without its colons, standing in for the
    integration's icon on this post. Unknown names fall back to it.
  `),
  attachments: z
    .array(z.record(z.string(), z.unknown()))
    .nullable()
    .optional()
    .describe('Slack-compatible attachment payload on integration posts.'),
  replyAuthorIds: z.array(Int()).optional().describe(oneLine`
    Who has replied, for the avatar row on the reply footer.
  `),
  replyCount: UInt().optional().describe('Replies hanging off this one.'),
  lastReplyAt: Timestamp().nullable().optional(),
})
  .meta({ id: 'Message' })
  .describe('A message in a thread.');

export type Message = z.infer<typeof Message>;

export const ThreadActivity = z
  .object({
    id: Int(),
    uid: Uid(),
    type: z.string(),
    data: z.record(z.string(), z.unknown()),
  })
  .meta({ id: 'ThreadActivity' })
  .describe('Anchor activity projection, for labels and deep links.');

export type ThreadActivity = z.infer<typeof ThreadActivity>;

export const ThreadElement = CommentElementRef.extend({ id: Int() })
  .meta({ id: 'ThreadElement' })
  .describe('Anchor content-element projection.');

export type ThreadElement = z.infer<typeof ThreadElement>;

// Enough of a thread to label it and open it.
export const ThreadRef = z
  .object({
    id: Int(),
    type: z.enum(ThreadType),
    title: z.string().nullable(),
    activityId: Int().nullable(),
    contentElementId: Int().nullable(),
    activity: ThreadActivity.nullable().optional(),
    contentElement: ThreadElement.nullable().optional(),
  })
  .meta({ id: 'ThreadRef' })
  .describe('Slim thread projection.');

export type ThreadRef = z.infer<typeof ThreadRef>;
