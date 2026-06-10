// Root barrel: top-level domain entities + their commonly-paired enums.
//
// Curated on purpose - sub-types, config shapes, join rows and other
// internals stay reachable via subpath imports
//
// import { Repository, User, ContentElement } from '@tailor-cms/interfaces';
//
// Add to this list deliberately - if a type is only useful in one slice
// it belongs at its subpath, not at the root.
//
// Domain entities
export type { Activity } from './activity';
export type { Asset } from './asset';
export type { Comment } from './comment';
export type { ContentElement } from './content-element';
export type { Repository, Tag } from './repository';
export type { Revision } from './revision';
export type { Schema } from './schema';
export type { User, UserSummary } from './user';
export type { UserGroup } from './user-group';
export type {
  UserActivityContext,
  UserActivityContextStored,
} from './user-activity';

// Runtime enums commonly used alongside the entities above
export { RepositoryRole, UserRole } from './role';
export { AssetType, ProcessingStatus } from './asset';
export { Entity } from './revision';
