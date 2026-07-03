import type { ContentElement, Relationship } from './content-element';
import type { UserSummary } from './user';

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
  assignee: UserSummary | null;
  status: string;
  description: string | null;
  priority: string;
  position: number | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Activity-level metadata bag. `name` is present on outline activities
interface Data {
  name?: string;
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
  refs: Record<string, Relationship[]>;
  status: Status[];
  isTrackedInWorkflow: boolean;
  detached: boolean;
  /** Whether this activity is an active linked copy */
  isLinkedCopy: boolean;
  /** Source activity ID (if link); null after the source is hard-deleted. */
  sourceId: number | null;
  /** Timestamp of source activity when linked; null when standalone. */
  sourceModifiedAt: string | null;
  elements?: ContentElement[];
  containers?: Activity[];
  modifiedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
