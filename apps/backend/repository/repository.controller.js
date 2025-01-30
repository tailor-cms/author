import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import { StatusCodes } from 'http-status-codes';
import { createId as cuid } from '@paralleldrive/cuid2';
import getVal from 'lodash/get.js';
import groupBy from 'lodash/groupBy.js';
import map from 'lodash/map.js';
import { Op } from 'sequelize';
import pick from 'lodash/pick.js';
import Promise from 'bluebird';
import { repository as role } from '@tailor-cms/common/src/role.js';
import sample from 'lodash/sample.js';
import { schema } from '@tailor-cms/config';
import { snakeCase } from 'change-case';
import { removeInvalidReferences } from '#shared/util/modelReference.js';
import publishingService from '#shared/publishing/publishing.service.js';
import db from '#shared/database/index.js';
import { createError } from '#shared/error/helpers.js';
import TransferService from '#shared/transfer/transfer.service.js';
import { createLogger } from '#logger';
import { general } from '#config';

const { NO_CONTENT, NOT_FOUND } = StatusCodes;

const miss = Promise.promisifyAll((await import('mississippi')).default);
const tmp = Promise.promisifyAll((await import('tmp')).default, {
  multiArgs: true,
});

const {
  Activity,
  ContentElement,
  Repository,
  RepositoryTag,
  RepositoryUser,
  Revision,
  sequelize,
  Tag,
  RepositoryUserGroup,
  User,
} = db;

const DEFAULT_COLORS = ['#689F38', '#FF5722', '#2196F3'];
const lowercaseName = sequelize.fn('lower', sequelize.col('repository.name'));

const JobCache = new Map();
const logger = createLogger('repository:controller');
const log = (msg) => logger.debug(msg.replace(/\n/g, ' '));

const getFilter = (search) => {
  const term = search.length < 3 ? `${search}%` : `%${search}%`;
  return { [Op.iLike]: term };
};

const includeUser = () => ({
  model: User,
  paranoid: false,
  attributes: [
    'id',
    'email',
    'firstName',
    'lastName',
    'fullName',
    'label',
    'imgUrl',
  ],
});

const includeLastRevision = () => ({
  model: Revision,
  include: [includeUser()],
  order: [['createdAt', 'DESC']],
  limit: 1,
});

const includeRepositoryUser = (user, query) => {
  const options =
    query && query.pinned
      ? { where: { userId: user.id, pinned: true }, required: true }
      : { where: { userId: user.id }, required: false };
  return { model: RepositoryUser, ...options };
};

const includeRepositoryTags = (query) => {
  const include = [{ model: Tag }];
  return query.tagIds
    ? [...include, { model: RepositoryTag, where: { tagId: query.tagIds } }]
    : include;
};

async function index({ query, user, opts, userGroupMemberships }, res) {
  const { search, name } = query;
  const schemas = query.schemas || general.availableSchemas;
  if (search) opts.where.name = getFilter(search);
  if (name) opts.where.name = name;
  if (schemas && schemas.length) opts.where.schema = schemas;
  if (getVal(opts, 'order.0.0') === 'name') opts.order[0][0] = lowercaseName;
  opts.distinct = true;
  opts.subQuery = false;
  opts.include = [
    includeRepositoryUser(user, query),
    { model: RepositoryUserGroup },
    ...includeRepositoryTags(query),
  ];
  if (!user.isAdmin()) {
    opts.where[Op.or] = [
      { '$repositoryUsers.user_id$': user.id },
      {
        '$repositoryUserGroups.group_id$': {
          [Op.in]: userGroupMemberships.map((it) => it.id),
        },
      },
    ];
  }
  const { rows: repositories, count } = await Repository.findAndCountAll(opts);
  const revisions = await Revision.findAll({
    where: { repositoryId: repositories.map((it) => it.id) },
    include: [includeUser()],
    attributes: [
      'repositoryId',
      [sequelize.fn('max', sequelize.col('revision.created_at')), 'createdAt'],
    ],
    order: [['createdAt', 'DESC']],
    group: ['repositoryId', 'user.id'],
  });
  const revisionsByRepository = groupBy(revisions, 'repositoryId');
  const items = repositories.map((repository) => ({
    ...repository.toJSON(),
    revisions: revisionsByRepository[repository.id],
  }));
  res.json({ total: count, items });
}

async function create({ user, body }, res) {
  const defaultMeta = getVal(schema.getSchema(body.schema), 'defaultMeta', {});
  const data = { color: sample(DEFAULT_COLORS), ...defaultMeta, ...body.data };
  const repository = await Repository.create(
    { ...body, data },
    {
      isNewRecord: true,
      returning: true,
      context: { userId: user.id },
    },
  );
  await RepositoryUser.create({
    repositoryId: repository.id,
    userId: user.id,
    role: role.ADMIN,
  });
  if (body.userGroupIds) {
    await repository.associateWithUserGroups(body.userGroupIds, user);
  }
  return res.json({ data: repository });
}

async function get({ repository, user }, res) {
  const include = [
    includeLastRevision(),
    includeRepositoryUser(user),
    { model: Tag },
  ];
  await repository.reload({ include });
  return res.json({ data: repository });
}

function patch({ user, repository, body }, res) {
  const data = pick(body, ['name', 'description', 'data']);
  return repository
    .update(data, { context: { userId: user.id } })
    .then((repository) => res.json({ data: repository }));
}

async function remove({ user, repository }, res) {
  const repo = await repository.destroy({ context: { userId: user.id } });
  publishingService.updateRepositoryCatalog(repo);
  return res.status(204).send();
}

async function pin({ user, repository, body }, res) {
  const opts = { where: { repositoryId: repository.id, userId: user.id } };
  const [repositoryUser] = await RepositoryUser.findOrCreate(opts);
  repositoryUser.pinned = body.pin;
  await repositoryUser.save();
  return res.json({ data: repositoryUser });
}

function clone({ user, repository, body }, res) {
  log(`[clone] initiated, repositoryId: ${repository.id}`);
  const { name, description } = body;
  const context = { userId: user.id };
  return repository
    .clone(name, description, context)
    .then((repository) => res.json({ data: repository }));
}

function publishRepoInfo({ repository }, res) {
  return publishingService
    .publishRepoDetails(repository)
    .then((data) => res.json({ data }));
}

function getUsers(req, res) {
  return req.repository.getUsers().then((users) =>
    res.json({
      data: map(users, (it) => ({
        ...it.profile,
        repositoryRole: it.repositoryUser.role,
      })),
    }),
  );
}

function upsertUser({ repository, body }, res) {
  const { email, role } = body;
  return User.inviteOrUpdate({ email })
    .then((user) => findOrCreateRole(repository, user, role))
    .then((user) => ({ ...user.profile, repositoryRole: role }))
    .then((user) => res.json({ data: { user } }));
}

function removeUser(req, res) {
  const {
    repository,
    params: { userId },
  } = req;
  const where = { userId, repositoryId: repository.id };
  return User.findByPk(userId)
    .then((user) => user || createError(NOT_FOUND, 'User not found'))
    .then(() => RepositoryUser.destroy({ where, force: true }))
    .then(() => res.end());
}

function findOrCreateRole(repository, user, role) {
  return RepositoryUser.findOrCreate({
    where: { repositoryId: repository.id, userId: user.id },
    defaults: { repositoryId: repository.id, userId: user.id, role },
    paranoid: false,
  })
    .then(([cu, created]) => (created ? cu : cu.update({ role })))
    .then((cu) => (cu.deletedAt ? cu.restore() : cu))
    .then(() => user);
}

function addTag({ body: { name }, repository }, res) {
  return sequelize.transaction(async (transaction) => {
    const [tag] = await Tag.findOrCreate({ where: { name }, transaction });
    await repository.addTags([tag], { transaction });
    return res.json({ data: tag });
  });
}

async function removeTag({ params: { tagId, repositoryId } }, res) {
  const where = { tagId, repositoryId };
  await RepositoryTag.destroy({ where });
  return res.status(NO_CONTENT).send();
}

async function initiateExportJob({ repository }, res) {
  const [outFile] = await tmp.fileAsync();
  const jobId = cuid();
  const options = { repositoryId: repository.id, schemaId: repository.schema };
  TransferService.createExportJob(outFile, options, jobId)
    .toPromise()
    .then((job) => {
      log(
        `[initiateExportJob] export job initiated,
        repositoryId: ${repository.id}, jobId: ${job.id}`,
      );
      // TODO: unlink job.filepath after timeout
      JobCache.set(job.id, job);
    })
    .catch(() => {
      fsp.unlink(outFile);
      return createError(NOT_FOUND);
    });
  return res.json({ data: jobId });
}

function getExportStatus({ params }, res) {
  const job = JobCache.get(params.jobId);
  const data = { isCompleted: !!job };
  return res.json({ data });
}

function exportRepository({ repository, params }, res) {
  const { jobId } = params;
  log(
    `[exportRepository] initiated, repositoryId: ${repository.id}, jobId: ${jobId}`,
  );
  const job = JobCache.get(jobId);
  if (!job) {
    log(`[exportRepository] job not found on export, jobId: ${jobId}`);
    return createError(NOT_FOUND);
  }
  res.attachment(`${snakeCase(repository.name)}.tgz`);
  const exportStream = fs.createReadStream(job.filepath);
  return miss.pipeAsync(exportStream, res).then(() => {
    JobCache.delete(jobId);
    return fsp.unlink(job.filepath);
  });
}

function importRepository({ body, file, user }, res) {
  log(`[importRepository] initiated, userId: ${user.id}, name: ${body.name}`);
  const { path } = file;
  const { name, description, userGroupIds } = body;
  const options = { description, name, userId: user.id, userGroupIds };
  return TransferService.createImportJob(path, options)
    .toPromise()
    .finally(() => {
      fsp.unlink(path);
      res.end();
    });
}

function validateReferences(req, res) {
  const { repository } = req;
  return repository.validateReferences().then((data) => res.json({ data }));
}

async function cleanupInvalidReferences(req, res) {
  const { body, repository } = req;
  await removeInvalidReferences(Activity, repository.id, body.activities);
  await removeInvalidReferences(ContentElement, repository.id, body.elements);
  return res.status(NO_CONTENT).send();
}

export default {
  index,
  create,
  get,
  patch,
  remove,
  initiateExportJob,
  export: exportRepository,
  getExportStatus,
  import: importRepository,
  pin,
  clone,
  getUsers,
  upsertUser,
  removeUser,
  publishRepoInfo,
  addTag,
  removeTag,
  validateReferences,
  cleanupInvalidReferences,
};
