import forEach from 'lodash/forEach.js';
import publishAccessService from '#shared/publishing/publish.access.service.js';

interface RepositoryUserGroupInstance {
  repositoryId: number;
  groupId: number;
}

type Hook = (
  hookType: string,
  instance: RepositoryUserGroupInstance,
) => unknown;

function add(RepositoryUserGroup: any, Hooks: any) {
  const hooks: Record<string, Hook[]> = {
    [Hooks.afterCreate]: [scheduleAccessUpdate],
    [Hooks.afterDestroy]: [scheduleAccessUpdate],
  };
  forEach(hooks, (hookFns, type) => {
    forEach(hookFns, (hook) => {
      RepositoryUserGroup.addHook(type, Hooks.withType(type, hook));
    });
  });
  function scheduleAccessUpdate(
    _hookType: string,
    instance: RepositoryUserGroupInstance,
  ) {
    publishAccessService.scheduleUpdate(instance.repositoryId);
  }
}

export default { add };
