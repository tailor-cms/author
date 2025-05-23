import { createRequire } from 'node:module';
import path from 'node:path';
import invoke from 'lodash/invoke.js';
import forEach from 'lodash/forEach.js';
import { SequelizeStorage, Umzug } from 'umzug';
import pick from 'lodash/pick.js';
import Promise from 'bluebird';
import semver from 'semver';
import Sequelize from 'sequelize';
import sequelizeConfig from '../../sequelize.config.cjs';

// Require models.
/* eslint-disable */
import User from '../../user/user.model.js';
import UserGroup from '#app/user-group/userGroup.model.js';
import UserGroupMember from '#app/user-group/userGroupMember.model.js';
import Repository from '../../repository/repository.model.js';
import RepositoryTag from '../../tag/repositoryTag.model.js';
import RepositoryUser from '../../repository/repositoryUser.model.js';
import RepositoryUserGroup from '#app/user-group/repositoryUserGroup.model.js';
import ActivityStatus from '../../activity/status.model.js';
import Activity from '../../activity/activity.model.js';
import ContentElement from '../../content-element/content-element.model.js';
import Revision from '../../revision/revision.model.js';
import Comment from '../../comment/comment.model.js';
import Tag from '../../tag/tag.model.js';
import Hooks from './hooks.js';
import { wrapMethods } from './helpers.js';
import config from '#config/database.js';
/* eslint-enable */

const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

const sequelize = createConnection(config);
const { migrationsPath } = sequelizeConfig;
const { logger } = config;

function initialize() {
  const umzug = new Umzug({
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({
      sequelize,
      tableName: config.migrationStorageTableName,
    }),
    migrations: {
      glob: path.join(migrationsPath, '*.js'),
      resolve: ({ name, path, context }) => {
        // Sequilize-CLI generates migrations that require
        // two parameters be passed to the up and down methods
        // but by default Umzug will only pass the first
        const migration = require(path || '');
        return {
          name,
          up: async () => migration.up(context, Sequelize),
          down: async () => migration.down(context, Sequelize),
        };
      },
    },
    logger,
  });

  umzug.on('migrating', (m) =>
    logger.info(`⬆️  Migrating: ${m.name}`),
  );
  umzug.on('migrated', (m) =>
    logger.info(`⬆️  Migrated: ${m.name}`),
  );
  umzug.on('reverting', (m) =>
    logger.info(`⬇️  Reverting: ${m.name}`),
  );
  umzug.on('reverted', (m) =>
    logger.info(`⬇️  Reverted: ${m.name}`),
  );

  return sequelize
    .authenticate()
    .then(() => logger.info(getConfig(sequelize), '🗄️  Connected to database'))
    .then(() => checkPostgreVersion(sequelize))
    .then(() => config.migrateOnStartup && umzug.up())
    .then(() => umzug.executed())
    .then((migrations) => {
      const files = migrations.map((it) => it.name);
      if (!files.length) return;
      logger.info(
        { migrations: files },
        '🗄️  Executed migrations:\n',
        files.join('\n'),
      );
    });
}

/**
 * Revision needs to be before Content Element to ensure its hooks are triggered
 * first. This is a temporary fix until a new system for setting up hooks is in
 * place.
 */
const models = {
  User: defineModel(User),
  UserGroup: defineModel(UserGroup),
  UserGroupMember: defineModel(UserGroupMember),
  Repository: defineModel(Repository),
  RepositoryTag: defineModel(RepositoryTag),
  RepositoryUser: defineModel(RepositoryUser),
  RepositoryUserGroup: defineModel(RepositoryUserGroup),
  ActivityStatus: defineModel(ActivityStatus),
  Activity: defineModel(Activity),
  Revision: defineModel(Revision),
  ContentElement: defineModel(ContentElement),
  Comment: defineModel(Comment),
  Tag: defineModel(Tag),
};

function defineModel(Model, connection = sequelize) {
  const { DataTypes } = connection.Sequelize;
  const fields = invoke(Model, 'fields', DataTypes, connection) || {};
  const options = invoke(Model, 'options') || {};
  Object.assign(options, { sequelize: connection });
  return Model.init(fields, options);
}

forEach(models, (model) => {
  invoke(model, 'associate', models);
  addHooks(model, Hooks, models);
  addScopes(model, models);
  wrapMethods(model, Promise);
});

function addHooks(model, Hooks, models) {
  const hooks = invoke(model, 'hooks', Hooks, models);
  forEach(hooks, (it, type) => model.addHook(type, it));
}

function addScopes(model, models) {
  const scopes = invoke(model, 'scopes', models);
  forEach(scopes, (it, name) => model.addScope(name, it, { override: true }));
}

const db = {
  Sequelize,
  sequelize,
  initialize,
  ...models,
};

wrapMethods(Sequelize.Model, Promise);
// Patch Sequelize#method to support getting models by class name.
sequelize.model = (name) => sequelize.models[name] || db[name];

function createConnection(config) {
  if (!config.url) return new Sequelize(config);
  return new Sequelize(config.url, config);
}

function getConfig(sequelize) {
  // NOTE: List public fields: https://git.io/fxVG2
  return pick(sequelize.config, [
    'database',
    'username',
    'host',
    'port',
    'protocol',
    'pool',
    'native',
    'ssl',
    'replication',
    'dialectModulePath',
    'keepDefaultTimezone',
    'dialectOptions',
  ]);
}

function checkPostgreVersion(sequelize) {
  return sequelize
    .getQueryInterface()
    .databaseVersion()
    .then((version) => {
      logger.info({ version }, 'PostgreSQL version:', version);
      const range = pkg.engines && pkg.engines.postgres;
      if (!range) return;
      if (semver.satisfies(semver.coerce(version), range)) return;
      const err = new Error(`"${pkg.name}" requires PostgreSQL ${range}`);
      logger.error({ version, required: range }, err.message);
      return Promise.reject(err);
    });
}

export { Sequelize, sequelize, initialize, models };

export default db;
