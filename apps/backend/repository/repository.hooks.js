import forEach from 'lodash/forEach.js';
import publishAccessService from '#shared/publishing/publish.access.service.js';

function add(Repository, Hooks) {
  const hooks = {
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

  function markAsUnpublished(_hookType, repository, { context }) {
    if (context) repository.hasUnpublishedChanges = true;
  }

  function scheduleAccessUpdate(_hookType, instance) {
    publishAccessService.scheduleUpdate(instance.id);
  }

  async function deleteAccessFile(_hookType, instance) {
    await publishAccessService.delete(instance.id);
  }
}

export default { add };
