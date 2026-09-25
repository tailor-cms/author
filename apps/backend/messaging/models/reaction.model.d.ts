import type { Model, ModelStatic, Optional } from 'sequelize';

export interface CommentReactionAttrs {
  commentId: number;
  userId: number;
  emoji: string;
  createdAt: string;
  updatedAt: string;
}

type GeneratedAttrs = 'createdAt' | 'updatedAt';

export type CommentReaction = CommentReactionAttrs &
  Model<CommentReactionAttrs, Optional<CommentReactionAttrs, GeneratedAttrs>>;

declare const CommentReaction: ModelStatic<CommentReaction>;
export default CommentReaction;
