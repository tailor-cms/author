import type { Model, ModelStatic } from 'sequelize';

export interface UserThreadAttrs {
  threadId: number;
  userId: number;
  lastReadAt: string;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserThread = UserThreadAttrs & Model<UserThreadAttrs>;

declare const UserThread: ModelStatic<UserThread>;
export default UserThread;
