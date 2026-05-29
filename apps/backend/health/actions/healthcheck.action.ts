import { defineAction } from '#shared/request/action.ts';
import { LivenessResponse } from '../health.schema.ts';

// GET /healthcheck - shallow liveness.
// Intentionally dependency-free: it only proves the process is up and the
// event loop is responsive.
export default defineAction({
  raw: true,
  openapi: {
    summary: 'Liveness probe',
    responses: {
      200: { description: 'Process is alive', schema: LivenessResponse },
    },
  },
  handler() {
    return { status: 'ok', uptime: process.uptime(), time: new Date().toISOString() };
  },
});
