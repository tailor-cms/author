import forEach from 'lodash/forEach.js';
import publishAccessService from '#shared/publishing/publish.access.service.js';

function add(UserGroupMember, Hooks, Models) {
  const hooks = {
    [Hooks.afterCreate]: [updateRepositoriesAccess],
    [Hooks.afterUpdate]: [updateRepositoriesAccess],
    [Hooks.afterDestroy]: [updateRepositoriesAccess],
  };

  forEach(hooks, (hookFns, type) => {
    forEach(hookFns, (hook) => {
      UserGroupMember.addHook(type, Hooks.withType(type, hook));
    });
  });

  async function updateRepositoriesAccess(_hookType, instance) {
    // Find all repositories associated with this group
    const associations = await Models.RepositoryUserGroup.findAll({
      where: { groupId: instance.groupId },
      attributes: ['repositoryId'],
    });
    // Schedule access update for each repository
    forEach(associations, (assoc) => {
      publishAccessService.scheduleUpdate(assoc.repositoryId);
    });
  }
}

export default { add };
