import type {
  InstanceDestroyOptions,
  InstanceUpdateOptions,
  Model,
  ModelStatic,
} from 'sequelize';

export interface UserThreadAttrs {
  threadId: number;
  userId: number;
  lastReadAt: string;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserThread = UserThreadAttrs &
  Model<UserThreadAttrs> & {
    update(
      values: Partial<UserThreadAttrs>,
      options?: InstanceUpdateOptions<UserThreadAttrs>,
    ): Promise<UserThread>;
    destroy(options?: InstanceDestroyOptions): Promise<UserThread>;
  };

declare const UserThread: ModelStatic<UserThread>;
export default UserThread;
