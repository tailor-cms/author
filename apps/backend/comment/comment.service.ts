// Business logic for the Comment slice.
// All DB orchestration lives here so the service surface is testable in
// isolation from Express.
import pickBy from 'lodash/pickBy.js';
import { createLogger } from '#logger';
import db from '#shared/database/index.js';
import type {
  CreateInput,
  ListFilter,
  ResolveInput,
} from './comment.schema.ts';
import type { Repository } from '../repository/models/repository.model.js';
import type { User } from '../user/models/user.model.js';
import type { Comment } from './models/comment.model.js';

const { Comment: CommentModel, ContentElement, User: UserModel } = db;

const logger = createLogger('comment:svc');

const includeAuthor = () => ({
  model: UserModel,
  as: 'author',
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

const includeElement = () => ({
  model: ContentElement,
  as: 'contentElement',
  attributes: ['uid', 'type'],
});

const standardIncludes = () => [includeAuthor(), includeElement()];

// Lists the repository's comments, optionally scoped to a single
// activity or element. `opts` is the `processQuery`-built shape
// (where/order/paranoid/limit/offset).
export async function list(
  repository: Repository,
  opts: any,
  filters: ListFilter,
): Promise<Comment[]> {
  if (filters.activityId) opts.where.activityId = filters.activityId;
  if (filters.contentElementId) {
    opts.where.contentElementId = filters.contentElementId;
  }
  return repository.getComments({ ...opts, include: standardIncludes() });
}

// Creates a comment authored by `user` and attached to `repository`.
// Returns the reloaded row with `author` + `contentElement` populated so
// the FE renders without an extra fetch.
export async function create(
  repository: Repository,
  user: User,
  payload: CreateInput,
): Promise<Comment> {
  const attrs = {
    repositoryId: repository.id,
    authorId: user.id,
    uid: payload.uid,
    activityId: payload.activityId,
    contentElementId: payload.contentElementId,
    content: payload.content,
  };
  logger.debug(
    {
      repositoryId: repository.id,
      activityId: payload.activityId,
      contentElementId: payload.contentElementId,
      authorId: user.id,
    },
    'Creating comment',
  );
  return CommentModel.create(attrs, { include: standardIncludes() });
}

// Replaces the comment's `content` and stamps `editedAt`. Author check
// happens at the route layer (`canEdit` mw); the service trusts the
// caller has the right to mutate.
export async function update(
  comment: Comment,
  content: string,
): Promise<Comment> {
  // Cast: editedAt is a Date column; the interface types it as string.
  const updated = await comment.update({
    content,
    editedAt: new Date(),
  } as any);
  return updated.reload({ include: standardIncludes() });
}

// Soft-deletes the comment (paranoid mode).
export async function remove(comment: Comment): Promise<Comment> {
  await comment.destroy();
  return comment;
}

export class InvalidResolveSelectorError extends Error {
  constructor(message = 'id or contentElementId required') {
    super(message);
    this.name = 'InvalidResolveSelectorError';
  }
}

// Toggles the resolved state of either a single comment (by `id`) or
// every comment attached to a content element (by `contentElementId`).
// At least one selector is required - throws `InvalidResolveSelectorError`
// otherwise (action layer maps to 400). Uses `bulkUpdate` so the
// element-wide branch is one query.
export async function updateResolvement(
  repository: Repository,
  payload: ResolveInput,
): Promise<void> {
  if (!payload.id && !payload.contentElementId) {
    throw new InvalidResolveSelectorError();
  }
  const where = pickBy(
    {
      id: payload.id,
      repositoryId: repository.id,
      contentElementId: payload.contentElementId,
    },
    (val) => !!val,
  );
  const resolvedAt = payload.resolvedAt ? null : new Date();
  logger.debug(
    {
      repositoryId: repository.id,
      id: payload.id,
      contentElementId: payload.contentElementId,
      resolved: !payload.resolvedAt,
    },
    'Updating comment resolvement',
  );
  // Cast: the model column is DATE, but the canonical interface types
  // `resolvedAt` as ISO string (wire shape).
  await CommentModel.update({ resolvedAt } as Partial<Comment>, {
    where,
    paranoid: false,
  });
}
