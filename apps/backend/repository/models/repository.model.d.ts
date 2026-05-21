import type {
  BelongsToManyAddAssociationsMixin,
  BelongsToManyGetAssociationsMixin,
  HasManyGetAssociationsMixin,
  InstanceDestroyOptions,
  InstanceUpdateOptions,
  Model,
  ModelStatic,
  Transaction,
} from 'sequelize';
import type {
  Activity,
  ContentElement,
  Repository as RepositoryAttrs,
  Schema,
  Tag,
  User,
} from '@tailor-cms/interfaces';
import type { OperationContext } from '#shared/database/types.ts';
import type { Comment } from '../../comment/models/comment.model.js';

// Helper: attach the platform's hook context option to a Sequelize options shape.
type WithContext<T> = T & { context?: OperationContext };

// A single dangling reference detected during validation.
// `src` is the entity that still holds the reference; `target` is what
// the reference points to but no longer exists; `referenceName` is the
// key on `src.refs` where the link lives (e.g. `prerequisites`).
export interface BrokenReference<TSrc = Activity | ContentElement> {
  src: TSrc;
  target: { id: number; entity?: string };
  referenceName: string;
}

// Output of Repository.validateReferences: dangling references grouped
// by the entity kind that holds them. Element entries' `src` is enriched
// by ContentElement.detectMissingReferences with its outline-activity
// pointer so the UI can deep-link.
export interface ReferenceValidationResult {
  activities: BrokenReference<Activity>[];
  elements: BrokenReference<ContentElement & { outlineActivity: Activity }>[];
}

// Subset of Sequelize-generated association mixins used by the controller.
// Sequelize creates one per association at runtime; we declare only the
// ones actually called from app code.
interface RepositoryAssociations {
  getUsers: BelongsToManyGetAssociationsMixin<User>;
  addTags: BelongsToManyAddAssociationsMixin<Tag, number>;
  getComments: HasManyGetAssociationsMixin<Comment>;
  getActivities: HasManyGetAssociationsMixin<Activity>;
}

// Sequelize instance type for a Repository row. Composes the canonical
// attributes (from @tailor-cms/interfaces) with the Sequelize Model API,
// the custom instance methods declared on the model class, and the
// association mixins generated for hasMany/belongsToMany relations.
export type Repository = RepositoryAttrs &
  Model<RepositoryAttrs> &
  RepositoryAssociations & {
    // True if the user has access via membership or user-group association
    hasAccess(user: User): Promise<boolean>;
    // Resolves the Schema configuration via the registry, falling back
    // to the `$$.schema` snapshot if the id has been removed from
    // @tailor-cms/config
    getSchemaConfig(): Schema;
    // Refreshes the `$$.schema` snapshot from the live registry when the
    // stored sha has drifted. Returns true if a write happened, false if
    // already in sync or the schema id is not in the registry.
    syncSchemaSnapshot(transaction?: Transaction): Promise<boolean>;
    // Mutating methods accept the platform's hook context option
    update(
      values: Partial<RepositoryAttrs>,
      options?: WithContext<InstanceUpdateOptions<RepositoryAttrs>>,
    ): Promise<Repository>;
    destroy(options?: WithContext<InstanceDestroyOptions>): Promise<Repository>;
    // Ensures `data.$$.ai.storeId` is populated. Returns the persisted
    // id - the existing one if another writer already set it, or
    // `storeId` if we won the race; `null` only if persistence failed
    // entirely.
    setVectorStoreId(storeId: string): Promise<string | null>;
    // Reads the AI vector store id from data.$$.ai.storeId; null if unset
    getVectorStoreId(): string | null;
    // Deep-clones this repository (activities + elements) under a new name
    clone(
      name: string,
      description: string,
      context: OperationContext,
    ): Promise<Repository>;
    // Scans activities/elements for references to missing entities
    validateReferences(
      transaction?: Transaction,
    ): Promise<ReferenceValidationResult>;
    // Recomputes hasUnpublishedChanges from outline activity timestamps
    updatePublishingStatus(excludedActivity?: Activity): Promise<Repository>;
    // Attaches the repository to the given user groups
    // (filtered by what the acting user has access to)
    associateWithUserGroups(
      userGroupIds: number[],
      user: User,
      transaction?: Transaction,
    ): Promise<void>;
  };

// Sequelize static type for the Repository model. Extends the standard
// ModelStatic surface (findByPk, create, update, etc.) with custom
// static methods declared on the model class.
interface RepositoryModel extends ModelStatic<Repository> {
  // Creates a Repository and the corresponding admin RepositoryUser row
  // in a single transaction
  createByUser(
    data: Partial<RepositoryAttrs>,
    options?: { context: OperationContext; transaction?: Transaction },
  ): Promise<Repository>;
}

declare const Repository: RepositoryModel;
export default Repository;
