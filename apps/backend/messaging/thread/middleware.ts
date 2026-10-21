import type { NextFunction, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';

const { Thread } = db;

// Param middleware: loads the Thread onto req and enforces repository
// scoping.
export async function getThread(
  req: any,
  _res: Response,
  next: NextFunction,
  threadId: string,
) {
  if (!Number.isInteger(Number(threadId))) {
    return createError(StatusCodes.BAD_REQUEST, 'Invalid id format');
  }
  const thread = await Thread.findByPk(threadId);
  if (!thread) return createError(StatusCodes.NOT_FOUND, 'Thread not found');
  if (thread.repositoryId !== req.repository?.id) {
    return createError(StatusCodes.FORBIDDEN, 'Access restricted');
  }
  req.thread = thread;
  next();
}
