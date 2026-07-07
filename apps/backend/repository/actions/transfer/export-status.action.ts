import * as schemas from '../../schemas/index.ts';
import { ExportJobStatus } from '#shared/transfer/types.ts';
import { clientExportError } from '#shared/transfer/errors.js';
import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import TransferService from '#shared/transfer/transfer.service.js';

// GET /repositories/:repositoryId/export/:jobId/status
// Reports whether the export job has produced its archive yet.
export default defineAction({
  params: schemas.ExportJobItemParams,
  openapi: {
    authenticated: true,
    summary: 'Get the status of a repository export job',
    responses: {
      200: {
        description: 'In-flight export job status.',
        schema: dataEnvelope(schemas.ExportStatusResult),
      },
    },
  },
  async handler({ params }) {
    const job = TransferService.getExportJob(params.jobId);
    const isFailed = job?.status === ExportJobStatus.Failed;
    return {
      isCompleted: job?.status === ExportJobStatus.Completed,
      isFailed,
      error: isFailed ? clientExportError(job.error) : undefined,
    };
  },
});
