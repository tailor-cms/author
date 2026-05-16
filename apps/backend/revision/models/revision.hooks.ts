// Listens for Create/Update/Remove on Repository, Activity, and
// ContentElement; appends an audit row to the Revision table. The
// `context.userId` carried on the operation options identifies the
// actor; ops without a userId are skipped (system-initiated changes).
import type { ModelStatic, Transaction } from 'sequelize';
import { constantCase } from '@tailor-cms/utils';
import { createLogger } from '#logger';
import forEach from 'lodash/forEach.js';
import { Operation } from '@tailor-cms/interfaces/revision';
import type { OperationContext } from '#shared/database/types.ts';
import type { Repository } from '../../repository/models/repository.model.js';

// Subset of the `db` bag this slice actually uses. Activity and
// ContentElement don't have their own .d.ts yet, so they fall back to
// the generic `ModelStatic` shape;
interface ModelsBag {
  Repository: ModelStatic<Repository>;
  Activity: ModelStatic<any>;
  ContentElement: ModelStatic<any>;
}

const castArray = <T>(arg: T | T[]): T[] => (Array.isArray(arg) ? arg : [arg]);

const logger = createLogger('revision:hooks');

// Minimum surface for any audited row.
// Repository/Activity/ContentElement all share it
interface AuditedInstance {
  id: number;
  repositoryId?: number;
  constructor: { name: string };
  toJSON(): unknown;
}

interface HookOptions {
  context?: OperationContext;
  transaction?: Transaction;
}

function add(
  Revision: any,
  Hooks: any,
  { Repository, Activity, ContentElement }: ModelsBag,
) {
  const hooks: Record<string, Operation> = {
    [Hooks.afterCreate]: Operation.Create,
    [Hooks.afterUpdate]: Operation.Update,
    [Hooks.afterRestore]: Operation.Update,
    [Hooks.afterDestroy]: Operation.Remove,
    [Hooks.afterBulkCreate]: Operation.Create,
  };

  const addHook = (Model: any, type: string, hook: any) =>
    Model.addHook(type, Hooks.withType(type, hook));

  const isRepository = (model: AuditedInstance) => model instanceof Repository;

  // TODO: Repositories are soft deleted already?
  // When repository is removed, its id is no longer valid and cannot be saved
  // as a foreign key. Remove this when repositories are soft-deleted:
  addHook(Repository, Hooks.afterCreate, createRevisions);
  addHook(Repository, Hooks.afterUpdate, createRevisions);

  forEach(hooks, (_, type) => addHook(Activity, type, createRevisions));
  forEach(hooks, (_, type) => addHook(ContentElement, type, createRevisions));

  function createRevisions(
    hookType: string,
    instances: AuditedInstance | AuditedInstance[],
    options: HookOptions,
  ) {
    const list = castArray(instances);
    const { context, transaction } = options;
    const records = list.reduce<any[]>((acc, it) => {
      const revision = getRevision(hookType, it, context);
      if (revision) acc.push(revision);
      return acc;
    }, []);
    if (!records.length) return;
    return Revision.bulkCreate(records, { transaction });
  }

  function getRevision(
    hookType: string,
    instance: AuditedInstance,
    context: OperationContext = {} as OperationContext,
  ) {
    if (!context.userId) return;
    const operation = hooks[hookType];
    // Skip revisions for nested linked content (children/elements of linked
    // activities). Only the link entry point gets a revision.
    if (
      (context as any).isNestedLinkedContent &&
      operation === Operation.Create
    ) {
      return;
    }
    const repositoryId = isRepository(instance)
      ? instance.id
      : instance.repositoryId;
    const entity = constantCase(instance.constructor.name);
    logger.info(
      { entity, operation, id: instance.id, repositoryId },
      `[Revision] ${entity}#${hookType}`,
    );
    return {
      repositoryId,
      entity,
      operation,
      state: instance.toJSON(),
      userId: context.userId,
    };
  }
}

export default { add };
