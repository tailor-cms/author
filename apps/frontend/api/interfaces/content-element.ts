import type { Activity } from './activity';

export interface Relationship {
  id: number;
  containerId: number;
  outlineId: number;
}

export interface RelationshipType {
  key: string;
  label: string;
  multiple: boolean;
  placeholder: string;
  allowedTypes: string[];
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
  refs: Record<string, Relationship>;
  /** Parent is soft-deleted */
  detached: boolean;
  /** Missing implementation */
  linked: boolean;
  /** Origin ID, used to detect a copy */
  contentId: string;
  /** Hash of a element data field, can be used to detect duplicates */
  contentSignature: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: null | string;
}
