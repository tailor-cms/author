import forEach from 'lodash/forEach.js';
import publishAccessService from '#shared/publishing/publish.access.service.js';
import { createLogger } from '#logger';
import type { OperationContext } from '#shared/database/types.ts';
import type { Repository } from './repository.model.js';

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
    [Hooks.beforeCreate]: [markAsUnpublished],
    [Hooks.beforeUpdate]: [markAsUnpublished],
    [Hooks.beforeDestroy]: [markAsUnpublished],
    [Hooks.afterCreate]: [scheduleAccessUpdate],
    [Hooks.afterDestroy]: [deleteAccessFile],
  };

  forEach(hooks, (hookFns, type) => {
    forEach(hookFns, (hook) => {
      Repository.addHook(type, Hooks.withType(type, hook));
    });
  });

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
