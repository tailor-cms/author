import type { Activity } from './activity';
import type { Comment } from './comment';
import type { ElementRelationship } from './schema';

export interface Relationship {
  id: number;
  containerId: number;
  outlineId: number;
  uid: string;
}

export interface RelationshipType extends ElementRelationship {
  value?: Relationship[];
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
  /** See element relationship configuration for details */
  refs: Record<string, Relationship | number>;
  /** Parent is soft-deleted */
  detached: boolean;
  /** Whether this element is an active linked copy from a library source */
  isLinkedCopy: boolean;
  /** ID of the source element in the library */
  sourceId?: number;
  /** Timestamp of source element when linked */
  sourceModifiedAt?: string;
  /** Origin ID, used to detect a copy */
  contentId: string;
  /** Hash of a element data field, can be used to detect duplicates */
  contentSignature: string;
  comments?: Comment[];
  hasUnresolvedComments?: boolean;
  embedded?: boolean;
  lastSeen?: number;
  changeSincePublish?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: null | string;
}
