import type { UserSummary } from './user';

export const ThreadType = {
  Repository: 'REPOSITORY',
  Activity: 'ACTIVITY',
  Element: 'ELEMENT',
} as const;

export type ThreadType = (typeof ThreadType)[keyof typeof ThreadType];

// Thread list filters.
export const ThreadScope = {
  All: 'all',
  Unread: 'unread',
  Mentions: 'mentions',
  Unresolved: 'unresolved',
  Mine: 'mine',
} as const;

export type ThreadScope = (typeof ThreadScope)[keyof typeof ThreadScope];

// Written by a person, or posted by an integration
export const CommentType = {
  User: 'USER',
  Integration: 'INTEGRATION',
} as const;

export type CommentType = (typeof CommentType)[keyof typeof CommentType];

// The element a comment is attached to
export interface CommentElementRef {
  uid: string;
  type: string;
}

// One person's emoji reaction, so it can be taken back
export interface Reaction {
  emoji: string;
  userId: number;
}

// Special case of a message: a comment left on an activity or
// on one of its elements
export interface Comment {
  id: number;
  uid: string;
  authorId: number;
  repositoryId: number;
  threadId?: number | null;
  type?: CommentType;
  activityId: number | null;
  contentElementId: number | null;
  content: string;
  author: UserSummary;
  contentElement: CommentElementRef | null;
  resolvedAt: string | null;
  createdAt: string;
  editedAt: string | null;
  updatedAt: string;
  deletedAt: string | null;
  reactions?: Reaction[];
}

// Longest message the server accepts
export const MESSAGE_MAX_LENGTH = 2000;

// What a `#` reference can point at. Saved inside the message text
// (`<#activity:42|The Basics>`), so it is part of the stored format
export const ReferenceType = {
  Activity: 'activity',
  Element: 'element',
  Asset: 'asset',
  Comment: 'comment',
} as const;

export type ReferenceType =
  (typeof ReferenceType)[keyof typeof ReferenceType];

// Tailor's own reporters, or another system posting through the webhook
export const IntegrationType = {
  Builtin: 'BUILTIN',
  External: 'EXTERNAL',
} as const;

export type IntegrationType =
  (typeof IntegrationType)[keyof typeof IntegrationType];

// The integration that posted, in place of a person
export interface IntegrationRef {
  id: number;
  // Stable identifier, for the built-in asset reporter
  key: string;
  name: string;
  icon: string | null;
  type: IntegrationType;
}

// A label/value row under an attachment
export interface AttachmentField {
  title?: string;
  value?: string;
  short?: boolean;
}

// A tile in the strip under an attachment.
export interface AttachmentPreview {
  entityType: string;
  entityId: string;
  label?: string;
}

// A block under a message
export interface Attachment {
  // A theme colour (`success`, `info`)....
  color?: string;
  pretext?: string;
  title?: string;
  title_link?: string;
  // Rendered like the message body, so `#` reference tokens become chips
  text?: string;
  fields?: AttachmentField[];
  footer?: string;
  tailor_previews?: AttachmentPreview[];
  tailor_previews_total?: number;
}

// Any post in a thread: a comment, an integration post, or a reply
export type Message = Omit<Comment, 'authorId' | 'author'> & {
  authorId: number | null;
  author: UserSummary | null;
  actorId?: number | null;
  actor?: UserSummary | null;
  // Replies are one level deep; a reply never has replies of its own
  parentId?: number | null;
  // A reply also sent to the channel
  isBroadcast?: boolean;
  // Reply summary shown under a parent
  replyCount?: number;
  lastReplyAt?: string | null;
  replyAuthorIds?: number[];
  // The integration that posted, instead of an author
  integrationId?: number | null;
  integration?: IntegrationRef | null;
  // A name or emoji the webhook payload chose for this one post; null
  // shows the integration's own
  senderName?: string | null;
  senderEmoji?: string | null;
  attachments?: Attachment[] | null;
};
