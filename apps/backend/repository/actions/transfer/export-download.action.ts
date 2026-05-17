import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import snakeCase from 'lodash/snakeCase.js';
import { createError } from '#shared/error/helpers.js';
import { createLogger } from '#logger';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { JobCache } from './job-cache.ts';

const logger = createLogger('repository:export');

// POST /repositories/:repositoryId/export/:jobId
// Streams the export archive built by the paired /setup endpoint.
const Params = z.object({
  jobId: z.string().min(1),
});

async function handler({ params, req, res }: Ctx<{ params: typeof Params }>) {
  const repository = req.repository!;
  const { jobId } = params;
  logger.debug(
    { repositoryId: repository.id, jobId },
    'Streaming export archive',
  );
  const job = JobCache.get(jobId);
  if (!job) {
    logger.warn(
      { repositoryId: repository.id, jobId },
      'Export job not found',
    );
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
  params: Params,
  openapi: {
    summary: 'Download the export archive for a repository',
    authenticated: true,
  },
  handler,
});
