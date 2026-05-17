import type {
  InstanceDestroyOptions,
  InstanceUpdateOptions,
  Model,
  ModelStatic,
} from 'sequelize';
import type { Comment as CommentAttrs } from '@tailor-cms/interfaces/comment';

// Sequelize instance type for a Comment entity. Composes the canonical
// attributes (from @tailor-cms/interfaces) with the Sequelize Model API.
export type Comment = CommentAttrs &
  Model<CommentAttrs> & {
    update(
      values: Partial<CommentAttrs>,
      options?: InstanceUpdateOptions<CommentAttrs>,
    ): Promise<Comment>;
    destroy(options?: InstanceDestroyOptions): Promise<Comment>;
    reload(options?: { include?: any[] }): Promise<Comment>;
  };

interface CommentModel extends ModelStatic<Comment> {
  // SSE event constants exposed on the model class (re-exported from
  // `@tailor-cms/common/src/sse`). Hooks reach for these by symbol.
  Events: {
    Create: string;
    Update: string;
    Delete: string;
  };
}

declare const Comment: CommentModel;
export default Comment;
