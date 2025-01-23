import type { ContentElement } from './content-element';
import type { User } from './user';

export interface StatusConfig {
  id: string;
  label: string;
  color: string;
  default?: boolean;
}

export interface Status {
  id: number;
  activityId: number;
  assigneeId: number | null;
  assignee: User | null;
  status: string;
  description: string | null;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface Data {
  name: string;
  [key: string]: any;
}

export interface Activity {
  id: number;
  uid: string;
  repositoryId: number;
  parentId?: number;
  type: string;
  position: number;
  data: Data;
  refs: Record<string, unknown>;
  status: Status[];
  isTrackedInWorkflow: boolean;
  detached: boolean;
  elements?: ContentElement[];
  containers?: Activity[];
  modifiedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
