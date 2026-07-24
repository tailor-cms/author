import type { OperationContext } from '#shared/database/types.ts';
import type { Repository } from './repository.model.js';
import { createLogger } from '#logger';
import { stripFileMetaVirtuals } from '../lib/data-attr.ts';
import forEach from 'lodash/forEach.js';
import publishAccessService from '#shared/publishing/publish.access.service.js';

const logger = createLogger('repository:hooks');

// Sequelize hook signature wrapped via Hooks.withType: receives the
// hook type as the first arg, then the standard Sequelize args.
type RepoHook = (
  hookType: string,
  instance: Repository,
  options: { context?: OperationContext },
) => unknown;

function add(Repository: any, Hooks: any) {
  const hooks: Record<string, RepoHook[]> = {
    [Hooks.beforeCreate]: [sanitizeFileMeta, markAsUnpublished],
    [Hooks.beforeUpdate]: [sanitizeFileMeta, markAsUnpublished],
    [Hooks.beforeDestroy]: [markAsUnpublished],
    [Hooks.afterCreate]: [scheduleAccessUpdate],
    [Hooks.afterDestroy]: [deleteAccessFile],
  };

  forEach(hooks, (hookFns, type) => {
    forEach(hookFns, (hook) => {
      Repository.addHook(type, Hooks.withType(type, hook));
    });
  });

  // Repository listings enrich FILE-type meta values with read-time
  // virtuals (signed URLs, backing asset id);
  function sanitizeFileMeta(_hookType: string, repository: Repository) {
    if (!repository.changed('data')) return;
    const inputs = repository.getFileMetaInputs();
    if (!inputs.length) return;
    const data = { ...repository.data };
    inputs.forEach(({ metaKey }: { metaKey: string }) => {
      data[metaKey] = stripFileMetaVirtuals(data[metaKey]);
    });
    repository.data = data;
  }

  function markAsUnpublished(
    _hookType: string,
    repository: Repository,
    { context }: { context?: OperationContext },
  ) {
    if (context) repository.hasUnpublishedChanges = true;
  }

  function scheduleAccessUpdate(_hookType: string, instance: Repository) {
    logger.debug(
      { repositoryId: instance.id },
      'Scheduling published-access update',
    );
    return publishAccessService.scheduleUpdate(instance.id);
  }

  function deleteAccessFile(_hookType: string, instance: Repository) {
    logger.debug(
      { repositoryId: instance.id },
      'Deleting published-access file',
    );
    return publishAccessService.delete(instance.id);
  }
}

export default { add };
