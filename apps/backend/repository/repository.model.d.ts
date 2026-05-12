import type {
  BelongsToManyAddAssociationsMixin,
  BelongsToManyGetAssociationsMixin,
  InstanceDestroyOptions,
  InstanceUpdateOptions,
  Model,
  ModelStatic,
  Transaction,
} from 'sequelize';
import type {
  Activity,
  Repository as RepositoryAttrs,
  Schema,
  Tag,
  User,
} from '@tailor-cms/interfaces';
import type { OperationContext } from '#shared/database/types.ts';

// Helper: attach the platform's hook context option to a Sequelize options shape.
type WithContext<T> = T & { context?: OperationContext };

// Output of Repository.validateReferences: lists of activity and element
// ids that reference missing entities (e.g. deleted activities still
// referenced by a `prerequisites` relationship).
export interface ReferenceValidationResult {
  activities: unknown[];
  elements: unknown[];
}

// Subset of Sequelize-generated association mixins used by the controller.
// Sequelize creates one per association at runtime; we declare only the
// ones actually called from app code. The associated User and Tag types
// reference the plain interface shapes; switching to full Sequelize-
// instance types is gated on User/Tag getting their own model.d.ts.
interface RepositoryAssociations {
  getUsers: BelongsToManyGetAssociationsMixin<User>;
  addTags: BelongsToManyAddAssociationsMixin<Tag, number>;
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
    // Returns the Schema configuration for this repository's schema id
    getSchemaConfig(): Schema;
    // Mutating methods accept the platform's hook context option
    update(
      values: Partial<RepositoryAttrs>,
      options?: WithContext<InstanceUpdateOptions<RepositoryAttrs>>,
    ): Promise<Repository>;
    destroy(options?: WithContext<InstanceDestroyOptions>): Promise<Repository>;
    // Atomically writes the AI vector store id into data.$$.ai.storeId.
    setVectorStoreId(storeId: string): Promise<boolean>;
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
