import type {
  BelongsToGetAssociationMixin,
  HasManyGetAssociationsMixin,
  InstanceDestroyOptions,
  InstanceUpdateOptions,
  Model,
  ModelStatic,
  Transaction,
} from 'sequelize';
import type { Activity as ActivityAttrs } from '@tailor-cms/interfaces/activity';
import type { OperationContext } from '#shared/database/types.ts';
import type { ActivityStatus } from './activity-status.model.js';
import type { Repository } from '../../repository/models/repository.model.js';

// Helper: attach the platform's hook context option to a Sequelize options shape.
type WithContext<T> = T & { context?: OperationContext };

// Source-activity display info for a linked copy.
export interface ActivitySourceInfo {
  id: number;
  uid: string;
  name?: string;
  repositoryId: number;
  repositoryName?: string;
}

// Active-copy summary returned by `findCopyLocations`. Only entry-point
// copies appear (not nested ones whose parent is also a linked copy).
export interface ActivityCopyLocation {
  id: number;
  uid: string;
  repositoryId: number;
  outlineActivityId?: number;
  name?: string;
  repositoryName?: string;
}

// Subset of children-tree traversal output used by `remove` /
// `restoreWithDescendants`.
export interface DescendantsResult {
  nodes: Activity[];
  leaves: Activity[];
  all?: Activity[];
}

// Mapping dictionaries returned by `cloneActivities`: source-id ->
// destination-id at the activity, element-id and element-uid layers.
// Consumed by `repository.mapClonedReferences` to remap refs.
export interface CloneIdMappings {
  activityId: Record<number, number>;
  elementId: Record<number, number>;
  elementUid: Record<string, string>;
}

interface ActivityAssociations {
  getRepository: BelongsToGetAssociationMixin<Repository>;
  getParent: BelongsToGetAssociationMixin<Activity>;
  getChildren: HasManyGetAssociationsMixin<Activity>;
  getComments: HasManyGetAssociationsMixin<unknown>;
  getStatus: HasManyGetAssociationsMixin<ActivityStatus>;
}

// Sequelize instance type for an Activity entity. Composes the canonical
// attributes (from @tailor-cms/interfaces) with the Sequelize Model API,
// the custom instance methods declared on the model class, and the
// association mixins generated for hasMany/belongsTo relations.
export type Activity = ActivityAttrs &
  Model<ActivityAttrs> &
  ActivityAssociations & {
    // Source-activity display info for a linked copy. Null when this is
    // not a copy or the source row has been hard-deleted.
    getSourceInfo(): Promise<ActivitySourceInfo | null>;
    // Active linked copies of this source activity, filtered to entry
    // points (parent is not itself a linked copy).
    findCopyLocations(): Promise<ActivityCopyLocation[]>;
    // Walks the parent chain to the top of the linked hierarchy.
    findLinkEntryPoint(transaction?: Transaction): Promise<Activity | null>;
    // Creates a deep clone in the target (repository, parent) location.
    // Returns the id-mapping bag (used by ref remapping at the repo level).
    clone(
      repositoryId: number,
      parentId: number | null,
      position: number | undefined,
      context: OperationContext,
    ): Promise<CloneIdMappings>;
    // Remaps `refs[relationship][i]` ids through `mappings`.
    mapClonedReferences(
      mappings: Record<number, number>,
      relationships: string[],
      transaction?: Transaction,
    ): Promise<Activity>;
    // In-place mutation of `refs`: removes any ref of `type` referencing `id`.
    removeReference(type: string, id: number): void;
    // Same-parent siblings (optionally filtered, optionally in transaction),
    // ordered by position ASC.
    siblings(opts: {
      filter?: Record<string, unknown>;
      transaction?: Transaction;
    }): Promise<Activity[]>;
    // Live ancestors (excluding soft-deleted ones); empty if the activity
    // is a root.
    predecessors(): Promise<Activity[]>;
    // Walks up the parent chain to the first outline-level activity.
    getFirstOutlineItem(item?: Activity): Promise<Activity>;
    // Children
    descendants(
      options?: { attributes?: string[]; paranoid?: boolean },
      nodes?: Activity[],
      leaves?: Activity[],
    ): Promise<DescendantsResult>;
    // Wrapping destroy: optional `recursive`/`soft` for tree mutations.
    // `soft: true` marks descendants as `detached` instead of destroying.
    remove(options?: {
      recursive?: boolean;
      soft?: boolean;
      context?: OperationContext;
      transaction?: Transaction;
    }): Promise<Activity>;
    // Restores the activity and its descendants, clearing `detached` on
    // child activities + elements.
    restoreWithDescendants(opts: { context: OperationContext }): Promise<void>;
    // Recalculates `position` from the target index among schema-defined
    // sibling types and persists in a transaction.
    reorder(index: number, context?: OperationContext): Promise<Activity>;
    // Returns the closest outline-level ancestor (or `undefined` at root).
    getOutlineParent(transaction?: Transaction): Promise<Activity | undefined>;
    // Runs content-element fetch hooks for embedded elements stored in
    // `data` (CollectionItemContent containers only); no-op otherwise.
    processEmbeddedElements(): Promise<Activity>;
    // Stamps `modifiedAt` with the current time so the publishing layer
    // recomputes per-item status.
    touch(transaction?: Transaction): Promise<Activity>;
    // Creates a status row for this activity (workflow tracking).
    createStatus(
      data: Partial<ActivityStatus>,
      options?: WithContext<{ transaction?: Transaction }>,
    ): Promise<ActivityStatus>;
    // Mutating methods accept the platform's hook context option
    update(
      values: Partial<ActivityAttrs>,
      options?: WithContext<InstanceUpdateOptions<ActivityAttrs>> & {
        hooks?: boolean;
      },
    ): Promise<Activity>;
    destroy(options?: WithContext<InstanceDestroyOptions>): Promise<Activity>;
  };

interface ActivityModel extends ModelStatic<Activity> {
  // Sequelize Events constants (re-exported from `@tailor-cms/common/src/sse`).
  Events: {
    Create: string;
    Update: string;
    BulkUpdate: string;
    Delete: string;
  };
  // Recursively clones `src` (and their descendants + elements) into
  // (`dstRepositoryId`, `dstParentId`), returning id-mapping dictionaries.
  cloneActivities(
    src: Activity[],
    dstRepositoryId: number,
    dstParentId: number | null,
    options: WithContext<{
      transaction?: Transaction;
      idMappings?: CloneIdMappings;
    }>,
  ): Promise<CloneIdMappings>;
  // Scans for cross-model references pointing at entities that no longer exist.
  detectMissingReferences(
    activities: Activity[],
    transaction?: Transaction,
  ): Promise<unknown[]>;
}

declare const Activity: ActivityModel;
export default Activity;
