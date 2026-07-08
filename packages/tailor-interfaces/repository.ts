import type { Activity } from './activity';
import type { Revision } from './revision';
import type { UserGroup } from './user-group';
import type { RepositoryRole } from './role';

// System-managed slot inside Repository.data.
// Stripped from publish manifests and export archives - never persist
// anything here that downstream consumers should see.
export interface RepositorySystemData {
  // Platform-managed AI state for repo-scoped retrieval and indexing
  ai?: {
    // OpenAI vector store id used for repo-scoped retrieval
    storeId?: string;
  };
  // Frozen backup of the Schema configuration this repository was built
  // against. Acts as a fallback when `Repository.schema` is no longer in
  // the live `@tailor-cms/config` registry (schema deletion) and as the
  // source of truth for external (paste/import) schemas not bundled.
  schema?: RepositorySchemaSnapshot;
}

// Schema-config backup stored under `data.$$.schema`. The platform syncs
// it against the live registry on writes; consumers should not read this
// directly - go through Repository.getSchemaConfig() which handles the
// registry-vs-snapshot fallback.
export interface RepositorySchemaSnapshot {
  // sha1 of `config` (via `hash-object`) - used to detect registry drift
  // and short-circuit redundant writes.
  sha: string;
  // Frozen Schema config blob (processed form, ready for use). Typed as
  // `unknown` at the wire layer; the BE doesn't validate the shape at
  // the API edge.
  config: unknown;
  // Origin of the snapshot:
  // - 'bundled': shipped in the `@tailor-cms/config` bundle at build time
  // - 'external': brought in at runtime (paste, import, re-registration)
  source: 'bundled' | 'external';
  // ISO timestamp of the last write.
  updatedAt: string;
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

// A FILE-type meta value on a Repository. Stored as { key, name }; repository
// listings enrich it with signed URLs (derived on read, never persisted) so
// the catalog can render a cover image without a round-trip per card.
export interface RepositoryFileMeta {
  // Storage key of the uploaded file.
  key: string;
  // Original file name.
  name: string;
  // Signed URL of the original file (present on list payloads).
  url?: string | null;
  // Signed URL of the cached thumbnail, if one has been generated.
  thumbnailUrl?: string | null;
  // Backing library asset id (lets the client reach the /thumbnail route).
  assetId?: number;
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
  // Populated only when the tag is loaded through a repository
  // association (e.g. via Repository.tags)
  RepositoryTag?: RepositoryTag;
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

// Slim user-with-role projection
export interface RepositoryMember {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  label: string;
  imgUrl: string;
  repositoryRole: RepositoryRole;
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
  // Tags attached to this repository (separate entity with its own
  // table). Optional because the BE only eager-loads them on some
  // endpoints
  tags?: Tag[];
  // Structural entity for repository structure.
  // Populated only when explicitly included.
  // Separate entity with its own table.
  activities?: Activity[];
  // Recording all changes to the repository and its associated entities.
  // Separate entity with its own table. Populated only when explicitly
  // included by the calling endpoint
  revisions?: Revision[];
  // Workspaces this repository is shared with. Optional (separate entity)
  userGroups?: UserGroup[];
  // All RepositoryUser rows for this repository. Optional (separate entity)
  repositoryUsers?: RepositoryUser[];
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
