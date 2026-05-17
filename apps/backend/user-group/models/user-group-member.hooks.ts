import type { ModelStatic } from 'sequelize';
import forEach from 'lodash/forEach.js';
import publishAccessService from '#shared/publishing/publish.access.service.js';
import type { RepositoryUserGroup } from './repository-user-group.model.js';
import type { UserGroupMember } from './user-group-member.model.js';

interface ModelsBag {
  RepositoryUserGroup: ModelStatic<RepositoryUserGroup>;
}

type MemberHook = (hookType: string, instance: UserGroupMember) => unknown;

function add(UserGroupMember: any, Hooks: any, Models: ModelsBag) {
  const hooks: Record<string, MemberHook[]> = {
    [Hooks.afterCreate]: [updateRepositoriesAccess],
    [Hooks.afterUpdate]: [updateRepositoriesAccess],
    [Hooks.afterDestroy]: [updateRepositoriesAccess],
  };
  forEach(hooks, (hookFns, type) => {
    forEach(hookFns, (hook) => {
      UserGroupMember.addHook(type, Hooks.withType(type, hook));
    });
  });
  // Group membership changes ripple into the published access file for
  // every repository shared with the group
  async function updateRepositoriesAccess(
    _hookType: string,
    instance: UserGroupMember,
  ) {
    const associations = await Models.RepositoryUserGroup.findAll({
      where: { groupId: instance.groupId },
      attributes: ['repositoryId'],
    });
    forEach(associations, (assoc: any) => {
      publishAccessService.scheduleUpdate(assoc.repositoryId);
    });
  }
}

export default { add };
