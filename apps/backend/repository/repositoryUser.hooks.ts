import forEach from 'lodash/forEach.js';
import publishAccessService from '#shared/publishing/publish.access.service.js';
import type { RepositoryUser } from './repositoryUser.model.js';

type RepoUserHook = (hookType: string, instance: RepositoryUser) => unknown;

function add(RepositoryUser: any, Hooks: any) {
  const hooks: Record<string, RepoUserHook[]> = {
    [Hooks.afterCreate]: [scheduleAccessUpdate],
    [Hooks.afterUpdate]: [scheduleAccessUpdate],
    [Hooks.afterDestroy]: [scheduleAccessUpdate],
  };
  forEach(hooks, (hookFns, type) => {
    forEach(hookFns, (hook) => {
      RepositoryUser.addHook(type, Hooks.withType(type, hook));
    });
  });

  function scheduleAccessUpdate(_hookType: string, instance: RepositoryUser) {
    publishAccessService.scheduleUpdate(instance.repositoryId);
  }
}

export default { add };
