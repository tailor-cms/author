import type {
  InstanceDestroyOptions,
  InstanceUpdateOptions,
  Model,
  ModelStatic,
} from 'sequelize';
import type { ThreadType } from '@tailor-cms/interfaces/comment';

export interface ThreadAttrs {
  id: number;
  repositoryId: number;
  activityId: number | null;
  contentElementId: number | null;
  type: ThreadType;
  title: string | null;
  messageCount: number;
  unresolvedCount: number;
  lastMessageAt: string | null;
  subscriptions: string[];
  participantIds: number[];
  createdAt: string;
  updatedAt: string;
}

export type Thread = ThreadAttrs &
  Model<ThreadAttrs> & {
    update(
      values: Partial<ThreadAttrs>,
      options?: InstanceUpdateOptions<ThreadAttrs>,
    ): Promise<Thread>;
    destroy(options?: InstanceDestroyOptions): Promise<Thread>;
  };

declare const Thread: ModelStatic<Thread>;
export default Thread;
