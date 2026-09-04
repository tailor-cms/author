import type { Model, ModelStatic, Optional } from 'sequelize';
import type { CommentType } from '@tailor-cms/interfaces/comment';

export interface CommentAttrs {
  id: number;
  uid: string;
  repositoryId: number;
  threadId: number | null;
  // Message it replies to. Replies are one level deep.
  parentId: number | null;
  // If anchored to entity
  activityId: number | null;
  contentElementId: number | null;
  // `user` for a person, `integration` for a non-human post
  type: CommentType;
  authorId: number | null;
  integrationId: number | null;
  // The person an integration post is about - "Jane published the
  // course". Set only on integration posts, which have no author.
  actorId: number | null;
  // A reply the author also wanted to be shown in the thread
  isBroadcast: boolean;
  content: string;
  // For integration posts
  // What this one post calls itself, from the webhook payload. Null
  // means it shows the integration's own name and icon.
  senderName: string | null;
  senderEmoji: string | null;
  // Slack-compatible attachment payload
  attachments: unknown[] | null;
  // Element comments can be resolved, which hides them from the editor
  resolvedAt: string | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

type GeneratedAttrs =
  | 'id'
  | 'uid'
  | 'type'
  | 'isBroadcast'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt';

export type Comment = CommentAttrs &
  Model<CommentAttrs, Optional<CommentAttrs, GeneratedAttrs>> & {
    reload(options?: { include?: any[] }): Promise<Comment>;
  };

interface CommentModel extends ModelStatic<Comment> {
  Events: {
    Create: string;
    Update: string;
    Delete: string;
  };
}

declare const Comment: CommentModel;
export default Comment;
