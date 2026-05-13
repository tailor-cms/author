import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { JobCache } from './job-cache.ts';

// GET /repositories/:repositoryId/export/:jobId/status
// Reports whether the export job has produced its archive yet.
const Params = z.object({
  jobId: z.string().min(1),
});

export default defineAction({
  params: Params,
  openapi: {
    summary: 'Get the status of a repository export job',
    authenticated: true,
  },
  async handler({ params }) {
    const job = JobCache.get(params.jobId);
    return { isCompleted: !!job };
  },
});
