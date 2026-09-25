import type { Model, ModelStatic, Optional } from 'sequelize';

export interface MentionAttrs {
  commentId: number;
  userId: number;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type GeneratedAttrs = 'readAt' | 'createdAt' | 'updatedAt';

export type Mention = MentionAttrs &
  Model<MentionAttrs, Optional<MentionAttrs, GeneratedAttrs>>;

declare const Mention: ModelStatic<Mention>;
export default Mention;
