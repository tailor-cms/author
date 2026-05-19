import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { createLogger } from '#logger';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../../repository.schema.ts';
import * as service from '../../repository.service.ts';

const logger = createLogger('repository:import');

// POST /repositories/import
// Imports a repository from an uploaded `.tgz` archive. The body fields
// arrive alongside the multipart `archive` file; `requireFile` below
// asserts the file was actually uploaded.

// Asserts the multipart middleware actually attached a file. Mounted by
// the router immediately after multer, before validation runs.
export const requireFile: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if ((req as any).file) return next();
  return res
    .status(StatusCodes.BAD_REQUEST)
    .json({ errors: [{ msg: 'No file provided' }] });
};

async function handler({
  body,
  user,
  req,
  res,
}: Ctx<{ body: typeof schemas.ImportBody }>) {
  const archivePath = req.file!.path;
  try {
    await service.importArchive(archivePath, {
      name: body.name,
      description: body.description,
      userId: user.id,
      userGroupIds: body.userGroupIds,
    });
    return res.end();
  } catch (err: any) {
    logger.warn({ err, userId: user.id, name: body.name }, 'Import job failed');
    if (!res.headersSent) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    return res.end();
  }
}

export default defineAction({
  body: schemas.ImportBody,
  openapi: {
    summary: 'Import a repository from a `.tgz` archive (multipart)',
    authenticated: true,
  },
  handler,
});
