import type { NextFunction, Response } from 'express';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';
import type { Repository } from '../repository/models/repository.model.js';
import { StatusCodes } from 'http-status-codes';
import type { User } from '../user/models/user.model.js';

const { ContentElement, Repository: RepositoryModel } = db;

// Param middleware: loads the ContentElement onto req and enforces
// repository scoping. paranoid:false so PATCH can restore soft-deleted rows.
// 400 for malformed ids, 404 when missing, 403 when the element belongs
// to a different repository than the one in scope.
export async function getContentElement(
  req: any,
  _res: Response,
  next: NextFunction,
  elementId: string,
) {
  if (!Number.isInteger(Number(elementId))) {
    return createError(StatusCodes.BAD_REQUEST, 'Invalid id format');
  }
  const element = await ContentElement.findByPk(elementId, { paranoid: false });
  if (!element) return createError(StatusCodes.NOT_FOUND, 'Not found');
  if (element.repositoryId !== req.repository?.id) {
    return createError(StatusCodes.FORBIDDEN, 'Access restricted');
  }
  req.contentElement = element;
  next();
}

// /link route middleware. Verifies the linked-source element exists and
// that the acting user has access to its repository (which may differ
// from the target). Runs before the schema validator on the link action,
// so we validate the id shape here too rather than passing arbitrary
// wire input straight into `findByPk`.
export async function hasLinkSourceAccess(
  req: any,
  _res: Response,
  next: NextFunction,
) {
  const sourceId = Number(req.body?.sourceId);
  if (!Number.isInteger(sourceId) || sourceId <= 0) {
    return createError(
      StatusCodes.BAD_REQUEST,
      'sourceId must be a positive integer',
    );
  }
  const source = await ContentElement.findByPk(sourceId, {
    include: [RepositoryModel],
  });
  if (!source) return createError(StatusCodes.NOT_FOUND, 'Source not found');
  const repository = (source as any).repository as Repository | undefined;
  if (!repository) {
    return createError(StatusCodes.NOT_FOUND, 'Source repository not found');
  }
  const hasAccess = await repository.hasAccess(req.user as User);
  if (!hasAccess) {
    return createError(StatusCodes.FORBIDDEN, 'No access to source repository');
  }
  next();
}
