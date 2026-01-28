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
  parentId: number | null;
  type: string;
  position: number;
  data: Data;
  refs: Record<string, unknown>;
  status: Status[];
  isTrackedInWorkflow: boolean;
  detached: boolean;
  /** Whether this activity is an active linked copy from a library source */
  isLinkedCopy: boolean;
  /** ID of the source activity in the library */
  sourceId?: number | null;
  /** Timestamp of source activity when linked */
  sourceModifiedAt?: string | null;
  elements?: ContentElement[];
  containers?: Activity[];
  modifiedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
