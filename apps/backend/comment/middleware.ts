import { StatusCodes } from 'http-status-codes';
import type { NextFunction, Response } from 'express';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';
import type { Comment } from './models/comment.model.js';

const { Comment: CommentModel, User } = db;

// Param middleware: loads the Comment (with its author projection) onto
// req. paranoid:false because PATCH/DELETE flows can target soft-deleted
// rows
export async function getComment(
  req: any,
  _res: Response,
  next: NextFunction,
  commentId: string,
) {
  const include = [
    {
      model: User,
      as: 'author',
      attributes: [
        'id',
        'email',
        'firstName',
        'lastName',
        'fullName',
        'imgUrl',
      ],
    },
  ];
  const comment = await CommentModel.findByPk(commentId, {
    include,
    paranoid: false,
  });
  if (!comment) return createError(StatusCodes.NOT_FOUND, 'Comment not found');
  req.comment = comment;
  next();
}

// Only the comment author may edit or delete it. Mounted after
// `getComment` so `req.comment` is always populated.
export function canEdit(req: any, _res: Response, next: NextFunction) {
  const { user, comment } = req as { user: { id: number }; comment: Comment };
  if (user.id !== comment.authorId) {
    return createError(StatusCodes.FORBIDDEN, 'Forbidden');
  }
  next();
}
