import type { NextFunction, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';
import { USER_SUMMARY_ATTRS } from '#app/user/user.schema.ts';

const { Comment: CommentModel, User } = db;

// Param middleware: loads the Comment (with its author projection) onto
// req and enforces repository scoping. paranoid:false because PATCH/DELETE
// flows can target soft-deleted rows. 404 when missing, 403 when the comment
// belongs to a different repository than the one in scope.
export async function getComment(
  req: any,
  _res: Response,
  next: NextFunction,
  commentId: string,
) {
  if (!Number.isInteger(Number(commentId))) {
    return createError(StatusCodes.BAD_REQUEST, 'Invalid id format');
  }
  const include = [{ model: User, as: 'author', attributes: USER_SUMMARY_ATTRS }];
  const comment = await CommentModel.findByPk(commentId, {
    include,
    paranoid: false,
  });
  if (!comment) return createError(StatusCodes.NOT_FOUND, 'Comment not found');
  if (comment.repositoryId !== req.repository?.id) {
    return createError(StatusCodes.FORBIDDEN, 'Access restricted');
  }
  req.comment = comment;
  next();
}

// Only the comment author may edit or delete it. Mounted after
// `getComment` so `req.comment` is always populated.
export function canEdit(req: any, _res: Response, next: NextFunction) {
  const { user, comment } = req;
  if (user.id !== comment.authorId) {
    return createError(StatusCodes.FORBIDDEN, 'Forbidden');
  }
  next();
}
