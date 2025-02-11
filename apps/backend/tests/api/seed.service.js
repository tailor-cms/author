import crypto from 'node:crypto';
import path from 'node:path';
import { faker } from '@faker-js/faker';
import find from 'lodash/find.js';
import mapKeys from 'lodash/mapKeys.js';
import { packageDirectory } from 'pkg-dir';
import catalogSeed from 'tailor-seed/repositories.json' with { type: 'json' };
import camelCase from 'lodash/camelCase.js';
import Promise from 'bluebird';
import { role as roles, UserRole } from '@tailor-cms/common';
import seedUsers from 'tailor-seed/user.json' with { type: 'json' };
import sortBy from 'lodash/sortBy.js';
import { store as activityCache } from '../../repository/feed/store.js';
import db from '#shared/database/index.js';
import TransferService from '#shared/transfer/transfer.service.js';

const { Activity, Repository, User, UserGroup, UserGroupMember } = db;

const DEFAULT_USER =
  find(seedUsers, { email: 'admin@gostudion.com' }) || seedUsers[0];

// Get seed repository path
const appDir = await packageDirectory();
const projectDir = await packageDirectory({ cwd: path.join(appDir, '..') });
const seedPath = path.join(projectDir, '/tests/fixtures/pizza.tgz');

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

  async seedCatalog(repositories = catalogSeed) {
    const user = await User.findOne({ where: { email: DEFAULT_USER.email } });
    if (!user) throw new Error('Seed user not found');
    const opts = { context: { userId: user.id } };
    return Promise.all(repositories.map((it) => Repository.create(it, opts)));
  }

  async importRepositoryArchive(
    name = `Test ${crypto.randomBytes(12).toString('hex')}`,
    description = `Test repository description`,
  ) {
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
    return { repository, activity };
  }

  async createUser(
    email = faker.internet.email(),
    password = faker.internet.password(),
    role = roles.ADMIN,
  ) {
    await User.create({
      email,
      password,
      role,
    });
    return { email, password };
  }
}

export default new SeedService();
