import * as os from 'node:os';
import * as path from 'node:path';
import * as fsp from 'node:fs/promises';
import * as schemas from '../../schemas/index.ts';
import { randomUUID } from 'node:crypto';
import { createId as cuid } from '@paralleldrive/cuid2';
import { createLogger } from '#logger';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import TransferService from '#shared/transfer/transfer.service.js';

const logger = createLogger('repository:export');

// Unique path inside the OS temp dir
// the TransferService writes the archive there.
const tmpExportPath = () =>
  path.join(os.tmpdir(), `repository-export-${randomUUID()}.tgz`);

// GET /repositories/:repositoryId/export/setup
// Kicks off the export job fire-and-forget. The client polls /status with
// the returned job id and downloads via the paired export endpoint.
async function handler({
  req,
}: Ctx<{ params: typeof schemas.RepositoryItemParams }>) {
  const repository = req.repository!;
  const outFile = tmpExportPath();
  const jobId = cuid();
  const options = { repositoryId: repository.id, schemaId: repository.schema };
  const job = TransferService.createExportJob(outFile, options, jobId);
  job.once('error', () => fsp.unlink(outFile).catch(() => {}));
  logger.debug({ repositoryId: repository.id, jobId }, 'Export job initiated');
  return jobId;
}

export default defineAction({
  name: 'initiateExport',
  params: schemas.RepositoryItemParams,
  openapi: {
    authenticated: true,
    summary: 'Initiate a repository export job',
    responses: {
      200: {
        description: 'Job id the caller polls status with and downloads via.',
        schema: dataEnvelope(schemas.ExportInitiateResult),
      },
    },
  },
  handler,
});
