import type { Model, ModelStatic } from 'sequelize';

export interface CommentReactionAttrs {
  commentId: number;
  userId: number;
  emoji: string;
  createdAt: string;
  updatedAt: string;
}

export type CommentReaction = CommentReactionAttrs &
  Model<CommentReactionAttrs>;

declare const CommentReaction: ModelStatic<CommentReaction>;
export default CommentReaction;
