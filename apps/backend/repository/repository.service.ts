// Business logic for the Repository slice.
//
// All DB orchestration, side effects (publishing,
// transfer jobs), and cross-model coordination live here so the service
// surface is testable in isolation from Express.
//
// Functions accept already-loaded model instances or primitive ids and
// return raw model instances / POJO data - they don't know about res,
// req, or HTTP status codes.
import { schema as schemaApi } from '@tailor-cms/config';
import * as fs from 'node:fs/promises';
import { Op } from 'sequelize';
import type { Transaction } from 'sequelize';
import getVal from 'lodash/get.js';
import groupBy from 'lodash/groupBy.js';
import map from 'lodash/map.js';
import pick from 'lodash/pick.js';
import sample from 'lodash/sample.js';

import type {
  BrokenActivityReference,
  BrokenElementReference,
  CreateInput,
  ListFilter,
  ListResult,
  PatchInput,
  RepositoryListItem,
  RepositoryMember,
} from './schemas/index.ts';
import type { Repository } from './models/repository.model.js';
import type { ResolvedStorageKey } from '../asset/types.ts';
import type { User } from '../user/models/user.model.js';
import { createLogger } from '#logger';
import { stripServerManaged } from './lib/data-attr.ts';
import { resolveByStorageKey } from '../asset/asset.service.ts';
import { removeInvalidReferences } from '#shared/util/modelReference.js';
import { subQuery } from '#shared/database/helpers.js';
import { USER_SUMMARY_ATTRS } from '#app/user/schemas/entity.ts';
import db from '#shared/database/index.js';
import publishingService from '#shared/publishing/publishing.service.js';
import TransferService from '#shared/transfer/transfer.service.js';
import UserGroup from '#app/user-group/models/user-group.model.js';

const {
  Activity,
  ContentElement,
  Repository: RepositoryModel,
  RepositoryTag,
  RepositoryUser,
  Revision,
  sequelize,
  Tag,
  RepositoryUserGroup,
  User,
} = db;

const logger = createLogger('repository:svc');

const DEFAULT_COLORS = ['#689F38', '#FF5722', '#2196F3'];
const lowercaseName = sequelize.fn('lower', sequelize.col('repository.name'));

// Sequelize include builder for the user attached to a revision/membership
// row. Includes soft-deleted users so historical attribution still works.
const includeUser = () => ({
  model: User,
  paranoid: false,
  attributes: USER_SUMMARY_ATTRS,
});

const includeRepositoryUser = (user: User, query?: { pinned?: boolean }) => {
  const options =
    query && query.pinned
      ? { where: { userId: user.id, pinned: true }, required: true }
      : { where: { userId: user.id }, required: false };
  return { model: RepositoryUser, ...options };
};

const includeRepositoryTags = (query: any) => {
  const { tagIds } = query;
  const include: any[] = [{ model: Tag }];
  return tagIds
    ? [...include, { model: RepositoryTag, where: { tagId: tagIds } }]
    : include;
};

const includeLastRevision = () => ({
  model: Revision,
  include: [includeUser()],
  order: [['createdAt', 'DESC']],
  limit: 1,
});

// Sub-queries used for visibility filtering on the list endpoint.
// Non-admin users only see repos they have direct membership in
// (RepositoryUser) or that belong to one of their user groups.
const selectUserRepositories = (userId: number) => subQuery(RepositoryUser, {
  attributes: ['repository_id'],
  where: { user_id: userId, has_access: true },
});

const selectGroupRepositories = (groupId: number | number[]) =>
  subQuery(RepositoryUserGroup, {
    attributes: ['repository_id'],
    where: { group_id: groupId },
  });

// OR-combined WHERE conditions restricting repositories to those a non-admin
// user may see: direct membership with access, or access via a user group.
// Exported so tag scoping stays identical to the catalog list; otherwise the
// two visibility rules drift and non-admins get a mismatched tag filter.
export const visibleRepositoryConditions = (user: User) => [
  { id: { [Op.in]: selectUserRepositories(user.id) } },
  { id: { [Op.in]: selectGroupRepositories(map(user.userGroups, 'id')) } },
];

// Lists repositories visible to the acting user with last-revision
// annotation per repo. Applies search/name/userGroup/compatibleWith
// filters; pagination + sort key come from `opts` (built by processQuery).
export async function list(
  opts: any,
  user: User,
  query: ListFilter,
): Promise<ListResult> {
  const { search, name, ids, userGroupId, compatibleWith } = query;
  let { schemas } = query;
  if (compatibleWith) {
    schemas = schemaApi.getCompatibleSchemaIds(compatibleWith);
  }
  opts.distinct = true;
  opts.include = [
    includeRepositoryUser(user, query),
    { model: UserGroup },
    ...includeRepositoryTags(query),
  ];
  if (search) opts.where.name = { [Op.iLike]: `%${search}%` };
  if (name) opts.where.name = name;
  if (schemas && schemas.length) opts.where.schema = schemas;
  if (getVal(opts, 'order.0.0') === 'name') opts.order[0][0] = lowercaseName;
  if (ids?.length) opts.where.id = { [Op.in]: ids };
  if (userGroupId) {
    const inGroup = { [Op.in]: selectGroupRepositories(userGroupId) };
    opts.where.id = opts.where.id
      ? { [Op.and]: [opts.where.id, inGroup] }
      : inGroup;
  }
  if (!user.isAdmin()) {
    opts.where[Op.or] = visibleRepositoryConditions(user);
  }
  const { rows: repositories, count } =
    await RepositoryModel.findAndCountAll(opts);
  const revisions = await Revision.findAll({
    where: { repositoryId: repositories.map((it: any) => it.id) },
    include: [includeUser()],
    attributes: [
      'repositoryId',
      [sequelize.fn('max', sequelize.col('revision.created_at')), 'createdAt'],
    ],
    order: [['createdAt', 'DESC']],
    group: ['repositoryId', 'user.id'],
  });
  const revisionsByRepository = groupBy(revisions, 'repositoryId');
  const fileMetaUrls = await resolveFileMetaUrls(repositories);
  const items: RepositoryListItem[] = repositories.map((repository: any) => {
    const item = repository.toJSON();
    fileMetaUrls.get(repository.id)?.forEach((resolved, metaKey) => {
      if (item.data?.[metaKey]) {
        item.data[metaKey] = { ...item.data[metaKey], ...resolved };
      }
    });
    return { ...item, revisions: revisionsByRepository[repository.id] };
  });
  return { total: count, items };
}

/**
 * Resolves signed URLs (original file + cached thumbnail) for every
 * FILE-type meta value across the given repositories. Every file meta key
 * gets an entry; null when no library asset backs the storage key (e.g.
 * uploads predating the asset library).
 */
async function resolveFileMetaUrls(repositories: any[]) {
  const inputs = repositories.flatMap((repo) =>
    repo
      .getFileMetaInputs()
      .map((input: any) => ({ repoId: repo.id, ...input })),
  );
  const byRepo = new Map<number, Map<string, ResolvedStorageKey | null>>();
  if (!inputs.length) return byRepo;
  const urlsByKey = await resolveByStorageKey(
    inputs.map((input) => input.storageKey),
  );
  inputs.forEach(({ repoId, metaKey, storageKey }) => {
    if (!byRepo.has(repoId)) byRepo.set(repoId, new Map());
    byRepo.get(repoId)!.set(metaKey, urlsByKey.get(storageKey) ?? null);
  });
  return byRepo;
}

// Creates a repository seeded with schema-default meta + a sampled label
// color, then optionally shares it with the supplied user groups.
export async function create(payload: CreateInput, user: User) {
  const defaultMeta = getVal(schemaApi.getSchema(payload.schema), 'defaultMeta', {});
  const data = {
    color: sample(DEFAULT_COLORS),
    ...defaultMeta,
    ...stripServerManaged(payload.data),
  };
  const repository = await RepositoryModel.createByUser(
    { ...payload, data },
    { context: { userId: user.id } },
  );
  if (payload.userGroupIds) {
    await repository.associateWithUserGroups(payload.userGroupIds, user);
  }
  return repository;
}

// Loads a detailed view of the repository
export async function loadDetail(repository: Repository, user: User) {
  const include: any[] = [
    includeLastRevision(),
    includeRepositoryUser(user),
    { model: UserGroup },
    { model: Tag },
  ];
  await repository.reload({ include });
  return repository;
}

// Updates the repository's mutable fields. Only name/description/data
// are honoured; anything else in `payload` is dropped. Server-managed
// fields in `data.$$` are stripped before persisting so FE callers can
// never overwrite them.
export async function update(
  repository: Repository,
  payload: PatchInput,
  user: User,
) {
  const updates: PatchInput = pick(payload, ['name', 'description', 'data']);
  if (updates.data) updates.data = stripServerManaged(updates.data);
  return repository.update(
    updates as Partial<Repository>,
    { context: { userId: user.id } },
  );
}

// Soft-deletes the repository and updates the published catalog so the
// removal propagates to consumers immediately.
export async function remove(repository: Repository, user: User) {
  const removed = await repository.destroy({ context: { userId: user.id } });
  // Fire-and-forget catalog update; catch here so a publish-side throw
  // (e.g. a Keyv/storage breakage) can't escape and crash the process.
  publishingService
    .updateRepositoryCatalog(removed)
    .catch((err: unknown) => logger.error({ err }, 'catalog update failed'));
  return removed;
}

// Toggles the pinned flag on the user's RepositoryUser row. Creates the
// row on first pin so newly-invited users can pin without a prior visit.
export async function pin(repository: Repository, user: User, pinned: boolean) {
  const opts = { where: { repositoryId: repository.id, userId: user.id } };
  const [repositoryUser] = await RepositoryUser.findOrCreate(opts);
  repositoryUser.pinned = pinned;
  await repositoryUser.save();
  return repositoryUser;
}

// Returns the active-access users of the repository decorated with their
// repository role (joined through RepositoryUser).
export async function listUsers(
  repository: Repository,
): Promise<RepositoryMember[]> {
  const users = await repository.getUsers({
    where: { '$repositoryUser.has_access$': true },
  });
  return users.map((it: any) => ({
    ...it.profile,
    repositoryRole: it.repositoryUser.role,
  }));
}

// Invites or updates a user's role on the repository. Returns the user's
// decorated profile (with `repositoryRole`).
export async function upsertUser(
  repository: Repository,
  email: string,
  role: string,
): Promise<RepositoryMember> {
  const user = await User.inviteOrUpdate({ email }) as User;
  await findOrCreateRole(repository, user, role);
  return { ...user.profile, repositoryRole: role } as RepositoryMember;
}

export class UserNotFoundError extends Error {
  constructor(message = 'User not found') {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

// Hard-deletes the user's RepositoryUser row, revoking access. Throws
// `UserNotFoundError` for unknown user ids. Removing the last repo
// admin is allowed - system admins always retain access
export async function removeUser(
  repository: Repository,
  userId: number,
): Promise<void> {
  const user = await User.findByPk(userId);
  if (!user) throw new UserNotFoundError();
  await RepositoryUser.destroy({
    where: { userId, repositoryId: repository.id },
    force: true,
    individualHooks: true,
  });
}

// Shares the repository with a user group. Returns `null` if the group
// id is unknown (controller maps to 404).
export async function addUserGroup(
  repository: Repository,
  userGroupId: number,
) {
  const userGroup = await UserGroup.findByPk(userGroupId);
  if (!userGroup) return null;
  await RepositoryUserGroup.create({
    repositoryId: repository.id,
    groupId: userGroupId,
  });
  return userGroup;
}

// Unshares the repository from the given user group.
export async function removeUserGroup(
  repository: Repository,
  userGroupId: number,
) {
  await RepositoryUserGroup.destroy({
    where: { repositoryId: repository.id, groupId: userGroupId },
    individualHooks: true,
  });
}

// Attaches a tag to the repository, creating the Tag row on first use.
// Wrapped in a transaction so the tag-create + association are atomic.
export async function addTag(repository: Repository, name: string) {
  return sequelize.transaction(async (transaction: Transaction) => {
    const [tag] = await Tag.findOrCreate({ where: { name }, transaction });
    await repository.addTags([tag], { transaction });
    return tag;
  });
}

// Removes a tag association (the Tag row itself is left in place).
export async function removeTag(repositoryId: number, tagId: number) {
  await RepositoryTag.destroy({ where: { tagId, repositoryId } });
}

// Imports a repository from an uploaded archive. The job runs through
// TransferService and emits via rxjs; the resulting repository row is
// fetched/created inside the job pipeline.
export async function importArchive(
  archivePath: string,
  options: {
    name: string;
    description?: string;
    userId: number;
    userGroupIds?: number[];
  },
) {
  logger.debug(
    { userId: options.userId, name: options.name },
    'Importing repository archive',
  );
  try {
    return await TransferService.createImportJob(archivePath, options).toPromise();
  } finally {
    fs.unlink(archivePath).catch(() => {});
  }
}

// Removes the supplied dangling references from activities + elements.
export async function cleanupReferences(
  repositoryId: number,
  activities: BrokenActivityReference[] = [],
  elements: BrokenElementReference[] = [],
): Promise<void> {
  await removeInvalidReferences(Activity, repositoryId, activities);
  await removeInvalidReferences(ContentElement, repositoryId, elements);
}

// Upserts a RepositoryUser row to the requested role, restoring it if it
// was previously soft-deleted. Internal helper for upsertUser().
async function findOrCreateRole(
  repository: Repository,
  user: User,
  role: string,
) {
  const [cu, isNew] = await RepositoryUser.findOrCreate({
    where: { repositoryId: repository.id, userId: user.id },
    defaults: {
      repositoryId: repository.id,
      userId: user.id,
      role,
      hasAccess: true,
    },
    paranoid: false,
  });
  const updated = isNew ? cu : await cu.update({ role, hasAccess: true });
  return updated.deletedAt ? updated.restore() : updated;
}
