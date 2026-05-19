import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../../repository.schema.ts';
import { JobCache } from './job-cache.ts';

// GET /repositories/:repositoryId/export/:jobId/status
// Reports whether the export job has produced its archive yet.
export default defineAction({
  params: schemas.ExportJobParams,
  openapi: {
    summary: 'Get the status of a repository export job',
    authenticated: true,
  },
  async handler({ params }) {
    const job = JobCache.get(params.jobId);
    return { isCompleted: !!job };
  },
});
