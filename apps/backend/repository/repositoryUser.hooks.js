import forEach from 'lodash/forEach.js';
import publishAccessService from '#shared/publishing/publish.access.service.js';

function add(RepositoryUser, Hooks) {
  const hooks = {
    [Hooks.afterCreate]: [scheduleAccessUpdate],
    [Hooks.afterUpdate]: [scheduleAccessUpdate],
    [Hooks.afterDestroy]: [scheduleAccessUpdate],
  };
  forEach(hooks, (hookFns, type) => {
    forEach(hookFns, (hook) => {
      RepositoryUser.addHook(type, Hooks.withType(type, hook));
    });
  });

  function scheduleAccessUpdate(_hookType, instance) {
    publishAccessService.scheduleUpdate(instance.repositoryId);
  }
}

export default { add };
