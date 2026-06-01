import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../../schemas/index.ts';
import { JobCache } from './job-cache.ts';

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
    const job = JobCache.get(params.jobId);
    return { isCompleted: !!job };
  },
});
