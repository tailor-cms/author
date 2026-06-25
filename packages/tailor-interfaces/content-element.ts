import type { Activity } from './activity';
import type { Comment } from './comment';
import type { ElementRelationship } from './schema';

// Pointer stored inside an element's/activity's `refs` bag.
export interface Relationship {
  id: number;
  uid?: string;
  containerId?: number;
  outlineId?: number;
}

export interface RelationshipType extends ElementRelationship {
  value?: Relationship[];
}

export interface ElementSourceInfo {
  id: number;
  uid: string;
  repositoryId: number;
  repositoryName?: string;
  activityId: number;
  outlineActivityId: number;
  outlineActivityName?: string;
  linkedAt?: string;
}

export interface ContentElement {
  id: number;
  uid: string;
  type: string;
  activity?: Activity;
  repositoryId: number;
  /** Container holding the element */
  activityId: number;
  /** Floating point indicating the position within the container */
  position: number;
  /** KV property bag, specific to the content element type */
  data: Record<string, unknown>;
  /** Data collected using meta input fields */
  meta: Record<string, unknown>;
  /**
   * Cross-element references keyed by the relationship types the schema
   * declares for this element type via `elementMeta.relationships[]`.
   * Values are arrays of pointers (see `Relationship`).
   */
  refs: Record<string, Relationship[]>;
  /** Parent is soft-deleted */
  detached: boolean;
  /** Whether this element is an active linked copy */
  isLinkedCopy: boolean;
  /** Source element ID (if link); null after the source is hard-deleted. */
  sourceId: number | null;
  /** Timestamp of source element when linked; null when standalone. */
  sourceModifiedAt: string | null;
  /** Origin ID, used to detect a copy */
  contentId: string;
  /** SHA-1 hash of `data`. Updated on every write */
  contentSignature?: string;
  comments?: Comment[];
  hasUnresolvedComments?: boolean;
  embedded?: boolean;
  lastSeen?: number;
  diffChange?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: null | string;
}
