import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { StatusCodes } from 'http-status-codes';
import { oneLine } from 'common-tags';
import snakeCase from 'lodash/snakeCase.js';
import { createError } from '#shared/error/helpers.js';
import { createLogger } from '#logger';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../../schemas/index.ts';
import { JobCache } from './job-cache.ts';

const logger = createLogger('repository:export');

// GET /repositories/:repositoryId/export/:jobId
async function handler({
  params,
  req,
  res,
}: Ctx<{ params: typeof schemas.ExportJobItemParams }>) {
  const { jobId } = params;
  const repository = req.repository!;
  logger.debug(
    { repositoryId: repository.id, jobId },
    'Streaming export archive',
  );
  const job = JobCache.get(jobId);
  if (!job) {
    logger.warn({ repositoryId: repository.id, jobId }, 'Export job not found');
    return createError(StatusCodes.NOT_FOUND);
  }
  res.attachment(`${snakeCase(repository.name)}.tgz`);
  const exportStream = fs.createReadStream(job.filepath);
  try {
    await pipeline(exportStream, res);
  } catch (err) {
    logger.warn(
      { err, repositoryId: repository.id, jobId },
      'Export stream failed',
    );
  } finally {
    JobCache.delete(jobId);
    fsp.unlink(job.filepath).catch(() => {});
  }
}

export default defineAction({
  name: 'downloadExport',
  params: schemas.ExportJobItemParams,
  openapi: {
    authenticated: true,
    summary: 'Download the export archive for a repository',
    description: oneLine`
      Streams the tarball built by a prior export-initiate call. The
      archive is removed from the job cache once the stream completes.
    `,
  },
  handler,
});
