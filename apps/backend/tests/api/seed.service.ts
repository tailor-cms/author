// Business logic for the test-seed slice.
// Test-only; gated by `ENABLE_TEST_API_ENDPOINTS`.
import crypto from 'node:crypto';
import path from 'node:path';
import { faker } from '@faker-js/faker';
import _ from 'lodash';
import { packageDirectory } from 'package-directory';
import catalogSeed from 'tailor-seed/repositories.json' with { type: 'json' };
import seedUsers from 'tailor-seed/user.json' with { type: 'json' };
import { UserRole } from '@tailor-cms/interfaces/role';
import { Op } from 'sequelize';

import type {
  CatalogInput,
  CommentInput,
  RepositoryInput,
  UserGroupSpec,
  UserInput,
} from './schemas/index.ts';
import { store as activityCache } from '../../repository/feed/store.ts';
import db from '#shared/database/index.js';
import linkService from '#shared/content-library/link.service.js';
import TransferService from '#shared/transfer/transfer.service.js';
import type { User } from '../../user/models/user.model.js';

const {
  Activity,
  Repository,
  RepositoryUserGroup,
  User: UserModel,
  UserGroup,
  UserGroupMember,
  Comment,
  ContentElement,
} = db;

interface SeedUser {
  email: string;
  password?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

const DEFAULT_USER: SeedUser =
  (_.find(seedUsers, { email: 'admin@gostudion.com' }) as SeedUser | undefined) ||
  (seedUsers[0] as SeedUser);

class SeedService {
  async resetDatabase(): Promise<boolean> {
    await db.sequelize.getQueryInterface().dropAllTables();
    await db.initialize();
    for (const it of _.sortBy(seedUsers, 'email') as SeedUser[]) {
      await UserModel.create(
        _.mapKeys(it, (_v, k) => _.camelCase(k)) as Partial<User>,
      );
    }
    await activityCache.clear();
    return true;
  }

  async seedCatalog(input: CatalogInput = {}) {
    const { userGroup } = input;
    const user = await UserModel.findOne({
      where: { email: DEFAULT_USER.email },
    });
    if (!user) throw new Error('Seed user not found');
    const opts = { context: { userId: user.id } };
    const repositories = await Promise.all(
      catalogSeed.map((it) => Repository.createByUser(it, opts)),
    );
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

  async importRepositoryArchive(input: RepositoryInput = {}) {
    const {
      name = `Test ${crypto.randomBytes(12).toString('hex')}`,
      description = 'Test repository description',
      authorEmail = null,
      includeLinkExample = false,
    } = input;
    // Get seed repository path
    const appDir = await packageDirectory();
    const projectDir = await packageDirectory({ cwd: path.join(appDir!, '..') });
    const seedPath = path.join(projectDir!, '/tests/fixtures/pizza.tgz');
    const user = await UserModel.findOne({
      where: { email: authorEmail || DEFAULT_USER.email },
    });
    if (!user) throw new Error('Seed user not found');
    const options = { name, description, userId: user.id };
    await TransferService.createImportJob(seedPath, options).toPromise();
    const repository = await Repository.findOne({
      where: { name, description },
      order: [['createdAt', 'DESC']],
    });
    if (!repository) throw new Error('Imported repository not found');
    const activity = await Activity.findOne({
      where: { 'repositoryId': repository.id, 'data.name': 'History of Pizza' },
    });
    const contentElement = await ContentElement.findOne({
      where: {
        'repositoryId': repository.id,
        'data.content': {
          [Op.like]: '%The Origins of Pizza%',
        },
      } as any,
    });
    const result = { repository, activity, contentElement };
    if (!includeLinkExample) return result;
    const context = { userId: user.id };
    const targetRepository = await Repository.createByUser(
      { schema: repository.schema, name: `Linked - ${name}`, description },
      { context },
    );
    const [linkedActivity] = await linkService.linkActivity(
      activity!.id,
      targetRepository,
      null,
      999,
      { ...context, repository: targetRepository },
    );
    return { ...result, linkedActivity };
  }

  async createUser(input: UserInput = {}) {
    const {
      email = faker.internet.email(),
      password = faker.internet.password(),
      role = UserRole.ADMIN,
      userGroup,
    } = input;
    const [user] = await UserModel.findOrCreate({
      where: { email },
      defaults: { email, password, role } as Partial<User>,
    });
    return {
      email,
      password,
      userGroup: userGroup
        ? await this.attachUserToGroup(user, userGroup)
        : null,
    };
  }

  async createComment(input: CommentInput) {
    const {
      content,
      repositoryId,
      activityId,
      contentElementId = null,
      authorEmail = null,
    } = input;
    const repository = await Repository.findByPk(repositoryId);
    if (!repository) throw new Error('Repository not found');
    const activity = await Activity.findByPk(activityId);
    if (!activity) throw new Error('Activity not found');
    if (contentElementId) {
      const element = await ContentElement.findByPk(contentElementId);
      if (!element) throw new Error('Content element not found');
    }
    const author = await UserModel.findOne({
      where: { email: authorEmail || DEFAULT_USER.email },
    });
    if (!author) throw new Error('Seed user not found');
    const comment = await Comment.create({
      content,
      repositoryId,
      activityId,
      contentElementId,
      authorId: author.id,
    } as any);
    return comment;
  }

  async attachUserToGroup(
    user: User,
    { name = 'Test Group', role = UserRole.ADMIN }: UserGroupSpec,
  ) {
    const userGroup = await UserGroup.create({ name } as any);
    await UserGroupMember.create({
      userId: user.id,
      groupId: userGroup.id,
      role,
    } as any);
    return userGroup;
  }
}

export default new SeedService();
