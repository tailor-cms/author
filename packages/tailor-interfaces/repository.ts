import type { Activity } from './activity';
import type { Revision } from './revision';
import type { UserGroup } from './user-group';
import { RepositoryRole } from './role';

export { RepositoryRole };
export type { Revision };

// System-managed slot inside Repository.data.
// Stripped from publish manifests and export archives - never persist
// anything here that downstream consumers should see.
export interface RepositorySystemData {
  // Platform-managed AI state for repo-scoped retrieval and indexing
  ai?: {
    // OpenAI vector store id used for repo-scoped retrieval
    storeId?: string;
  };
}

// Free-form bag of meta values attached to a Repository. Most keys come
// from the schema's `meta[]` configuration; `color` and `$$` are the
// only slots reserved by the platform (documented inline below).
// (color is a legacy holdover from before the schema-driven design)
export interface RepositoryData {
  // Auto-injected COLOR meta value (label color). Added by the schema
  // processor when the schema does not declare its own `color` meta.
  color?: string;
  // Internal namespace stripped on publish/export.
  // (e.g. AI vector store id)
  $$?: RepositorySystemData;
  // Schema-defined meta values
  [key: string]: unknown;
}

// Join row connecting a Repository to a Tag (many-to-many through table).
export interface RepositoryTag {
  // Repository side of the join
  repositoryId: number;
  // Tag side of the join
  tagId: number;
}

// User-defined label that can be attached to repositories for filtering
// and grouping in the catalog.
export interface Tag {
  id: number;
  // Stable UUID used for client-side identity.
  uid: string;
  // Display name; unique across the system.
  name: string;
  // Populated when the tag is loaded through a repository association
  RepositoryTag: RepositoryTag;
}

// Join row that grants a User access to a Repository with a specific role.
// Composite primary key: (userId, repositoryId).
export interface RepositoryUser {
  userId: number;
  repositoryId: number;
  // Whether the user can access the repository through this membership.
  // Set to false to revoke access without deleting the association
  // to preserve historical data (e.g. revisions) and avoid FK issues.
  hasAccess: boolean;
  // Repository-scoped role
  role: RepositoryRole;
  // Whether the repository is pinned in the user's catalog view
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  // Soft-delete timestamp; null if active
  deletedAt: string | null;
}

// Join row connecting a Repository to a UserGroup (workspace).
export interface RepositoryUserGroup {
  repositoryId: number;
  groupId: number;
}

// Top-level content container in Tailor. Every repository follows the
// rules of a single Schema (referenced by `schema`), which dictates the
// structure of its activities, content containers, and meta inputs.
export interface Repository {
  id: number;
  // Stable UUID used as the client-side identity (e.g. store Map key)
  uid: string;
  // Schema id (key for schema registry)
  schema: string;
  name: string;
  description: string;
  // Schema-driven JSONB blob. See RepositoryData for platform-managed
  // keys; remaining keys come from the schema's meta[] config
  data: RepositoryData;
  // Tags attached to this repository
  // Separate entity with its own table
  tags: Tag[];
  // Structural entity for repository structure.
  // Populated only when explicitly included.
  // Separate entity with its own table.
  activities?: Activity[];
  // Recording all changes to the repository and its associated entities.
  // Separate entity with its own table.
  // Populated only when explicitly included.
  revisions: Revision[];
  // Workspaces this repository is shared with
  userGroups?: UserGroup[];
  // All RepositoryUser rows for this repository
  repositoryUsers: RepositoryUser[];
  // Current user's RepositoryUser
  // Convenience, FE derived
  repositoryUser?: RepositoryUser;
  // Convenience pointer to the most recent revision.
  // Convenience, FE derived
  lastChange?: Revision;
  // True if any outline activity has draft changes since last publish
  hasUnpublishedChanges: boolean;
  // true if the current user can administer this repository
  // Convenience, FE derived
  hasAdminAccess?: boolean;
  createdAt: string;
  updatedAt: string;
  // Soft-delete timestamp; null if active
  deletedAt: string | null;
}
