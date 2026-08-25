import type { InstanceDestroyOptions, Model, ModelStatic } from 'sequelize';

export interface CommentReactionAttrs {
  commentId: number;
  userId: number;
  emoji: string;
  createdAt: string;
  updatedAt: string;
}

export type CommentReaction = CommentReactionAttrs &
  Model<CommentReactionAttrs> & {
    destroy(options?: InstanceDestroyOptions): Promise<CommentReaction>;
  };

declare const CommentReaction: ModelStatic<CommentReaction>;
export default CommentReaction;
