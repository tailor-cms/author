import type {
  InstanceUpdateOptions,
  Model,
  ModelStatic,
} from 'sequelize';

export interface MentionAttrs {
  commentId: number;
  userId: number;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Mention = MentionAttrs &
  Model<MentionAttrs> & {
    update(
      values: Partial<MentionAttrs>,
      options?: InstanceUpdateOptions<MentionAttrs>,
    ): Promise<Mention>;
  };

declare const Mention: ModelStatic<Mention>;
export default Mention;
