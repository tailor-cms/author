import type {
  BelongsToGetAssociationMixin,
  FindOptions,
  InstanceDestroyOptions,
  InstanceUpdateOptions,
  Model,
  ModelStatic,
  Transaction,
} from 'sequelize';

import type {
  ContentElement as ContentElementAttrs,
  ElementSourceInfo,
} from '@tailor-cms/interfaces/content-element';
import type { OperationContext } from '#shared/database/types.ts';

// Helper: attach the platform's hook context option to a Sequelize options shape.
type WithContext<T> = T & { context?: OperationContext };

// Result of `findCopyLocations()`; one row per active linked copy with
// repository + outline-activity decoration for FE deep-linking.
export interface CopyLocation {
  id: number;
  uid: string;
  repositoryId: number;
  activityId: number;
  repositoryName?: string;
  outlineActivityId?: number;
  outlineActivityName?: string;
  linkedAt: string;
}

// Mapping bag used by `mapClonedReferences` when remapping refs across
// cloned activities + elements. Built by the cloning pipeline.
export interface CloneReferenceMappings {
  elementId: Record<number, number>;
  elementUid: Record<string, string>;
  activityId: Record<number, number>;
}

// Output of `cloneElements`: dictionaries from source -> destination ids
// and uids for the cloned batch, consumed by the refs remap step.
export interface CloneElementsResult {
  idMap: Record<number, number>;
  uidMap: Record<string, string>;
}

// Subset of Sequelize-generated association mixins used by the slice.
interface ContentElementAssociations {
  getActivity: BelongsToGetAssociationMixin<unknown>;
  getRepository: BelongsToGetAssociationMixin<unknown>;
}

// Sequelize instance type for a ContentElement entry. Composes the canonical
// attributes (from @tailor-cms/interfaces) with the Sequelize Model API,
// the custom instance methods declared on the model class, and the
// association mixins generated for belongsTo relations.
export type ContentElement = ContentElementAttrs &
  Model<ContentElementAttrs> &
  ContentElementAssociations & {
    // In-place mutation of `refs`: removes any ref of `type` referencing `id`.
    removeReference(type: string, id: number): void;
    // Remaps element refs from source ids/uids to destination ones using the
    // provided mappings. Refs that fail to resolve are dropped (logged).
    mapClonedReferences(
      mappings: CloneReferenceMappings,
      transaction?: Transaction,
    ): Promise<ContentElement>;
    // Returns siblings sharing the same `activityId`, ordered by position.
    siblings(filter?: Record<string, unknown>): Promise<ContentElement[]>;
    // Recalculates the element's `position` from the supplied target index
    // among reorder-eligible siblings
    reorder(index: number): Promise<ContentElement>;
    // Predicate used by `reorder` to scope siblings
    getReorderFilter(): Promise<Record<string, unknown>>;
    // Loads the source element's display info for a linked copy. Returns
    // null when the element is not a linked copy or the source has been
    // hard-deleted.
    getSourceInfo(): Promise<ElementSourceInfo | null>;
    // Returns one row per active linked copy of this source element across
    // repositories
    findCopyLocations(): Promise<CopyLocation[]>;
    // Mutating methods accept the platform's hook context option
    update(
      values: Partial<ContentElementAttrs>,
      options?: WithContext<InstanceUpdateOptions<ContentElementAttrs>> & {
        hooks?: boolean;
      },
    ): Promise<ContentElement>;
    destroy(
      options?: WithContext<InstanceDestroyOptions>,
    ): Promise<ContentElement>;
  };

// Sequelize static type for the ContentElement model. Extends the standard
// ModelStatic surface with custom static methods declared on the model class.
interface ContentElementModel extends ModelStatic<ContentElement> {
  // SSE event constants exposed on the model class (re-exported from
  // `@tailor-cms/common/src/sse`).
  Events: {
    Create: string;
    Update: string;
    BulkUpdate: string;
    Delete: string;
  };
  // Convenience accessor that mirrors `findByPk`/`findAll` semantics and
  // runs the fetch hooks (afterRetrieve + afterLoaded + resolveStatics)
  // against the loaded row(s) before returning.
  fetch(id: number): Promise<ContentElement | null>;
  fetch(options: FindOptions<ContentElementAttrs>): Promise<ContentElement[]>;
  // Bulk-clones the supplied elements into the target activity, returning
  // the source -> destination id + uid mappings.
  cloneElements(
    src: ContentElement[],
    container: { id: number; repositoryId: number },
    options: WithContext<{ transaction?: Transaction }>,
  ): Promise<CloneElementsResult>;
  // Scans for cross-model references pointing at entities that no longer
  // exist; each entry is decorated with the outline-activity pointer
  // (`src.outlineActivity`) so the frontend can deep-link.
  detectMissingReferences(
    elements: ContentElement[],
    transaction?: Transaction,
  ): Promise<unknown[]>;
}

declare const ContentElement: ContentElementModel;
export default ContentElement;
