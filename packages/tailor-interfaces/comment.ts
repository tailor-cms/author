import type { UserSummary } from './user';

export const ThreadType = {
  Repository: 'REPOSITORY',
  Activity: 'ACTIVITY',
  Element: 'ELEMENT',
} as const;

export type ThreadType = (typeof ThreadType)[keyof typeof ThreadType];

// Slim content-element projection eager-loaded onto Comment
export interface CommentElementRef {
  uid: string;
  type: string;
}

export interface Comment {
  id: number;
  uid: string;
  authorId: number;
  repositoryId: number;
  // `null` when element is removed to hide the comment from activity thread
  activityId: number | null;
  contentElementId: number | null;
  content: string;
  author: UserSummary;
  contentElement: CommentElementRef | null;
  resolvedAt: string | null;
  createdAt: string;
  editedAt: string | null;
  updatedAt: string;
  deletedAt: string | null;
}
