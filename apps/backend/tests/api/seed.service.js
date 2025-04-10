import crypto from 'node:crypto';
import path from 'node:path';
import { faker } from '@faker-js/faker';
import find from 'lodash/find.js';
import mapKeys from 'lodash/mapKeys.js';
import { packageDirectory } from 'pkg-dir';
import catalogSeed from 'tailor-seed/repositories.json' with { type: 'json' };
import camelCase from 'lodash/camelCase.js';
import Promise from 'bluebird';
import seedUsers from 'tailor-seed/user.json' with { type: 'json' };
import sortBy from 'lodash/sortBy.js';
import { UserRole } from '@tailor-cms/common';
import { Op } from 'sequelize';

import { store as activityCache } from '../../repository/feed/store.js';
import db from '#shared/database/index.js';
import TransferService from '#shared/transfer/transfer.service.js';

const {
  Activity,
  Repository,
  RepositoryUserGroup,
  User,
  UserGroup,
  UserGroupMember,
  Comment,
  ContentElement,
} = db;

const DEFAULT_USER =
  find(seedUsers, { email: 'admin@gostudion.com' }) || seedUsers[0];

class SeedService {
  async resetDatabase() {
    await db.sequelize.drop({});
    await db.initialize();
    await Promise.each(
      sortBy(seedUsers, 'email'),
      (it) => User.create(mapKeys(it, (_, k) => camelCase(k))));
    await activityCache.clear();
    return true;
  }

  async seedCatalog({ repositorySeed = catalogSeed, userGroup }) {
    const user = await User.findOne({ where: { email: DEFAULT_USER.email } });
    if (!user) throw new Error('Seed user not found');
    const opts = { context: { userId: user.id } };
    const repositories = await Promise.all(
      repositorySeed.map((it) => Repository.create(it, opts)));
    if (userGroup?.name) {
      const [group] = await UserGroup.findOrCreate({
        where: { name: userGroup.name },
      });
      for (const repository of repositories) {
        await RepositoryUserGroup.create({
          repositoryId: repository.id,
          groupId: group.id,
        });
      }
    }
    return repositories;
  }

  async importRepositoryArchive(
    name = `Test ${crypto.randomBytes(12).toString('hex')}`,
    description = `Test repository description`,
  ) {
    // Get seed repository path
    const appDir = await packageDirectory();
    const projectDir = await packageDirectory({ cwd: path.join(appDir, '..') });
    const seedPath = path.join(projectDir, '/tests/fixtures/pizza.tgz');
    const user = await User.findOne({ where: { email: DEFAULT_USER.email } });
    if (!user) throw new Error('Seed user not found');
    const options = {
      name,
      description,
      userId: user.id,
    };
    await TransferService.createImportJob(seedPath, options).toPromise();
    const repository = await Repository.findOne({
      where: { name, description },
      order: [['createdAt', 'DESC']],
    });
    const activity = await Activity.findOne({
      where: { 'repositoryId': repository.id, 'data.name': 'History of Pizza' },
    });
    const contentElement = await ContentElement.findOne({
      where: {
        'repositoryId': repository.id,
        'data.content': {
          [Op.like]: '%The Origins of Pizza%',
        },
      },
    });
    return { repository, activity, contentElement };
  }

  async createUser(
    email = faker.internet.email(),
    password = faker.internet.password(),
    role = UserRole.ADMIN,
    userGroup,
  ) {
    const [user] = await User.findOrCreate({
      where: { email },
      defaults: { password, role },
    });
    return {
      email,
      password,
      userGroup: userGroup ? (await this.attachUserToGroup(user, userGroup)) : null,
    };
  }

  async createComment(
    content,
    repositoryId,
    activityId,
    contentElementId = null,
  ) {
    const repository = await Repository.findByPk(repositoryId);
    if (!repository) throw new Error('Repository not found');
    const activity = await Activity.findByPk(activityId);
    if (!activity) throw new Error('Activity not found');
    if (contentElementId) {
      const element = await ContentElement.findByPk(contentElementId);
      if (!element) throw new Error('Content element not found');
    }
    const author = await User.findOne({ where: { email: DEFAULT_USER.email } });
    if (!author) throw new Error('Seed user not found');
    const comment = await Comment.create({
      content,
      repositoryId,
      activityId,
      contentElementId,
      authorId: author.id,
    });
    return comment;
  }

  async attachUserToGroup(user, { name = 'Test Group', role = UserRole.ADMIN }) {
    const userGroup = await UserGroup.create({ name });
    await UserGroupMember.create({
      userId: user.id,
      groupId: userGroup.id,
      role,
    });
    return userGroup;
  }
}

export default new SeedService();
