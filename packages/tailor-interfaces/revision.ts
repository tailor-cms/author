import type { UserSummary } from './user';

export const Entity = {
  Repository: 'REPOSITORY',
  Activity: 'ACTIVITY',
  ContentElement: 'CONTENT_ELEMENT',
} as const;

export type Entity = (typeof Entity)[keyof typeof Entity];

export const Operation = {
  Create: 'CREATE',
  Update: 'UPDATE',
  Remove: 'REMOVE',
} as const;

export type Operation = (typeof Operation)[keyof typeof Operation];

export interface Revision {
  id: number;
  uid: string;
  userId: number;
  repositoryId: number;
  entity: Entity;
  operation: Operation;
  state: Record<string, unknown>;
  user?: UserSummary;
  createdAt: string;
  updatedAt: string;
}
