// Business logic for the ContentElement slice.
// All DB orchestration lives here so the service surface is testable in
// isolation from Express.
import { createLogger } from '#logger';
import db from '#shared/database/index.js';
import type { Repository } from '../repository/models/repository.model.js';
import type { User } from '../user/models/user.model.js';
import type {
  ContentElement,
  CopyLocation,
} from './models/content-element.model.js';
import type { ElementSourceInfo } from '@tailor-cms/interfaces/content-element';

import type {
  CreateInput,
  LinkInput,
  ListFilter,
  PatchInput,
} from './schemas/index.ts';

const { Activity, ContentElement: ContentElementModel } = db;

// Domain failure: source element id does not exist. Caught by the action
// layer and mapped to 404.
export class SourceNotFoundError extends Error {
  constructor(message = 'Source element not found') {
    super(message);
    this.name = 'SourceNotFoundError';
  }
}

const logger = createLogger('content-element:svc');

// Returns the elements matched by `opts` (built by processQuery) and the
// supplied filters. `detached=false` is applied by default; an
// `activityIds` filter is implemented as an INNER JOIN on Activity so
// the result is scoped to the supplied parent activities.
export async function list(opts: any, filters: ListFilter) {
  if (!filters.detached) opts.where = { ...opts.where, detached: false };
  if (filters.activityIds) {
    const where = { id: filters.activityIds };
    opts.include = { model: Activity.unscoped(), attributes: [], where };
  }
  return ContentElementModel.fetch(opts);
}

// Creates an element on `repository`. The action's Zod schema has
// already stripped unknown keys from `body`, so the wire shape *is*
// the persisted attribute set; we just inject `repositoryId` from the
// loaded repo
export async function create(
  repository: Repository,
  user: User,
  body: CreateInput,
): Promise<ContentElement> {
  const context = { userId: user.id, repository };
  return ContentElementModel.create(
    { ...body, repositoryId: repository.id } as any,
    { context } as any,
  );
}

// Updates mutable fields. Also restores from soft-delete: any element
// with `deletedAt` set is brought back (the `setDataValue` clears it
// in-memory so the subsequent UPDATE sees the row as live).
export async function update(
  repository: Repository,
  user: User,
  element: ContentElement,
  body: PatchInput,
): Promise<ContentElement> {
  const context = { userId: user.id, repository };
  if (element.deletedAt) (element as any).setDataValue('deletedAt', null);
  await element.update(body as any, { context } as any);
  return element;
}

// Soft-deletes the element.
export async function remove(
  repository: Repository,
  user: User,
  element: ContentElement,
): Promise<void> {
  const context = { userId: user.id, repository };
  await element.destroy({ context } as any);
}

// Recalculates the element's position from the target index among
// reorder-eligible siblings
export async function reorder(
  element: ContentElement,
  position: number,
): Promise<ContentElement> {
  await element.reorder(position);
  return element;
}

// Links an element from another repository into the target repository.
// Creates a linked copy that receives auto-sync updates from source.
// Access to the source repository is enforced upstream by the
// `hasLinkSourceAccess` route middleware before this is reached.
export async function link(
  repository: Repository,
  user: User,
  body: LinkInput,
): Promise<ContentElement> {
  const source = await ContentElementModel.findByPk(body.sourceId);
  if (!source) throw new SourceNotFoundError();
  logger.debug(
    {
      sourceId: source.id,
      targetRepositoryId: repository.id,
      activityId: body.activityId,
    },
    'Linking content element from source',
  );
  const context = { userId: user.id, repository };
  return ContentElementModel.create(
    {
      type: source.type,
      data: source.data,
      meta: source.meta,
      refs: {},
      repositoryId: repository.id,
      activityId: body.activityId,
      position: body.position,
      isLinkedCopy: true,
      sourceId: source.id,
      sourceModifiedAt: source.updatedAt,
      contentId: source.contentId,
    } as any,
    { context } as any,
  );
}

// Converts a linked copy into a local copy. `sourceId` is preserved so
// provenance survives; only `isLinkedCopy` + `sourceModifiedAt` flip.
// Hooks are bypassed so unlinking doesn't fire the linked-content sync.
export async function unlink(
  repository: Repository,
  user: User,
  element: ContentElement,
): Promise<ContentElement> {
  const context = { userId: user.id, repository };
  await element.update(
    { isLinkedCopy: false, sourceModifiedAt: null } as any,
    { context, hooks: false } as any,
  );
  return element;
}

// Returns the source element's display info for a linked copy, or null
// when the element is not a copy / the source has been hard-deleted.
export function getSourceInfo(
  element: ContentElement,
): Promise<ElementSourceInfo | null> {
  return element.getSourceInfo();
}

// Returns the active linked copies of this source element across
// repositories, decorated with outline-activity pointers for FE deep-linking.
export function getCopies(element: ContentElement): Promise<CopyLocation[]> {
  return element.findCopyLocations();
}
