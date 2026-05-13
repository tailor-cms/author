import * as os from 'node:os';
import * as path from 'node:path';
import * as fsp from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createId as cuid } from '@paralleldrive/cuid2';
import { createLogger } from '#logger';
import TransferService from '#shared/transfer/transfer.service.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { JobCache } from './job-cache.ts';

const logger = createLogger('repository:export');

// Unique path inside the OS temp dir
// the TransferService writes the archive there.
const tmpExportPath = () =>
  path.join(os.tmpdir(), `repository-export-${randomUUID()}.tgz`);

// GET /repositories/:repositoryId/export/setup
// Kicks off the export job fire-and-forget. The client polls /status with
// the returned job id and downloads via the paired export endpoint.
async function handler({ req }: Ctx) {
  const repository = req.repository!;
  const outFile = tmpExportPath();
  const jobId = cuid();
  const options = { repositoryId: repository.id, schemaId: repository.schema };
  TransferService.createExportJob(outFile, options, jobId)
    .toPromise()
    .then((job: any) => {
      logger.debug(
        { repositoryId: repository.id, jobId: job.id },
        'Export job initiated',
      );
      // TODO: unlink job.filepath after timeout
      JobCache.set(job.id, job);
    })
    .catch((err: any) => {
      logger.warn(
        { err, repositoryId: repository.id, jobId },
        'Export job failed',
      );
      fsp.unlink(outFile).catch(() => {});
    });
  return jobId;
}

export default defineAction({
  openapi: {
    summary: 'Initiate a repository export job',
    authenticated: true,
  },
  handler,
});
