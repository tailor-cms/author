// Comment entity and its related sub-shapes.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import {
  Int,
  IntParam,
  RepositoryScopedParams,
} from '#shared/request/schemas.ts';
import { UserSummary } from '#app/user/user.schema.ts';

// Path param shape for every `/:commentId` route. Extends
// RepositoryScopedParams so the OpenAPI doc reflects the full path
export const CommentItemParams = RepositoryScopedParams.extend({
  commentId: IntParam().describe('Numeric comment id (path param).'),
});

export type CommentItemParams = z.infer<typeof CommentItemParams>;

// Slim element projection attached to a comment when the parent
// element is loaded. Matches the include used by the service layer.
export const CommentElementRef = z
  .object({
    uid: z.uuid().describe('Content element UUID.'),
    type: z.string().describe('Content-element type id.'),
  })
  .meta({ id: 'CommentElementRef' })
  .describe('Slim content-element projection attached to a comment.');

export type CommentElementRef = z.infer<typeof CommentElementRef>;

// The full Comment entity as returned by the API.
export const Comment = z
  .object({
    id: Int().describe('Numeric primary key.'),
    uid: z.uuid().describe('Stable UUID; persists across clones / imports.'),
    repositoryId: Int().describe('Repository the comment belongs to.'),
    activityId: Int().nullable().describe(oneLine`
      Parent activity id. Cleared to null when the parent element is
      removed, so the comment drops out of the activity-thread view
      but stays attached to its element for provenance.
    `),
    contentElementId: Int().nullable().describe(oneLine`
      Parent content-element id; null for activity-level discussion.
    `),
    authorId: Int().describe('Author user id.'),
    author: UserSummary.optional().describe('Eager-loaded author.'),
    content: z.string().min(1).max(2000).describe(oneLine`
      Comment body. The model's \`len: [1, 2000]\` validator caps the
      length. For soft-deleted comments the getter returns a
      "This comment has been deleted" placeholder; \`deletedAt\` is the
      authoritative deletion signal.
    `),
    contentElement: CommentElementRef
      .nullable()
      .optional()
      .describe('Eager-loaded element pointer; null when activity-level.'),
    resolvedAt: z.iso
      .datetime({ offset: true })
      .nullable()
      .describe('Timestamp the thread was resolved at; null for open threads.'),
    editedAt: z.iso
      .datetime({ offset: true })
      .nullable()
      .describe('Last edit timestamp; null when never edited.'),
    createdAt: z.iso
      .datetime({ offset: true })
      .describe('Insertion timestamp.'),
    updatedAt: z.iso
      .datetime({ offset: true })
      .describe('Last mutation timestamp.'),
    deletedAt: z.iso
      .datetime({ offset: true })
      .nullable()
      .describe('Soft-delete timestamp; non-null for archived rows.'),
  })
  .meta({ id: 'Comment' })
  .describe(oneLine`
    A repository comment. Either an activity-level discussion or
    an inline thread attached to a specific content element.
  `);

export type Comment = z.infer<typeof Comment>;
