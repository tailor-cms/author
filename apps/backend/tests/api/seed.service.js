import catalogSeed from 'tailor-seed/repositories.json' with { type: 'json' };
import crypto from 'node:crypto';
import db from '../../shared/database/index.js';
import { faker } from '@faker-js/faker';
import { packageDirectory } from 'pkg-dir';
import path from 'node:path';
import { role as roles } from 'tailor-config-shared';
import seedUsers from 'tailor-seed/user.json' with { type: 'json' };
import TransferService from '../../shared/transfer/transfer.service.js';

const { Activity, Repository, User } = db;

const DEFAULT_USER = seedUsers[0];
// Get seed repository path
const appDir = await packageDirectory();
const projectDir = await packageDirectory({ cwd: path.join(appDir, '..') });
const seedPath = path.join(projectDir, '/tests/fixtures/pizza.tgz');

class SeedService {
  async resetDatabase() {
    await db.sequelize.drop({});
    await db.initialize();
    await Promise.all(seedUsers.map((it) => User.create(it)));
    return true;
  }

  async seedCatalog(repositories = catalogSeed) {
    const user = await User.findOne({ where: { email: DEFAULT_USER.email } });
    if (!user) throw new Error('Seed user not found');
    const opts = { context: { userId: user.id } };
    return Promise.all(repositories.map((it) => Repository.create(it, opts)));
  }

  async importRepositoryArchive(
    name = `Test repository ${crypto.randomUUID()}`,
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
      where: { repositoryId: repository.id, 'data.name': 'History of Pizza' },
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
