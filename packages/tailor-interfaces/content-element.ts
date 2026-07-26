import type { Activity } from './activity';
import type { Comment } from './comment';
import type { ElementRelationship } from './schema';

export enum DiffChangeTypes {
  New = 'new',
  Changed = 'changed',
  Removed = 'removed',
}

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

/**
 * Persisted columns of a content element.
 */
export interface ContentElementAttrs {
  id: number;
  uid: string;
  type: string;
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
  createdAt: string;
  updatedAt: string;
  deletedAt: null | string;
}

/**
 * The persisted columns from `ContentElementAttrs`, plus two kinds of non-column
 * fields; associations attached on read (associations like `activity`/`comments`,
 * computed flags) and client-only/processed attrs (`parent`, `lastSeen`,
 * `diffChange`). The backend model is typed by `ContentElementAttrs`, so
 * none of these appear on a persisted instance.
 */
export interface ContentElement extends ContentElementAttrs {
  /** Owning outline activity, when loaded via include */
  activity?: Activity;
  comments?: Comment[];
  hasUnresolvedComments?: boolean;
  embedded?: boolean;
  /** Parent/composite element when focusing an embed (client-only) */
  parent?: ContentElement;
  lastSeen?: number;
  /** Client-only: publish-diff change marker */
  diffChange?: DiffChangeTypes;
}
