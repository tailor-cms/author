import forEach from 'lodash/forEach.js';
import publishAccessService from '#shared/publishing/publish.access.service.js';

function add(RepositoryUserGroup, Hooks, Models) {
  const hooks = {
    [Hooks.afterCreate]: [scheduleAccessUpdate],
    [Hooks.afterDestroy]: [scheduleAccessUpdate],
  };

  forEach(hooks, (hookFns, type) => {
    forEach(hookFns, (hook) => {
      RepositoryUserGroup.addHook(type, Hooks.withType(type, hook));
    });
  });

  function scheduleAccessUpdate(hookType, instance) {
    publishAccessService.scheduleUpdate(instance.repositoryId);
  }
}

export default { add };
