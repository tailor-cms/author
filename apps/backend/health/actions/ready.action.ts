import { defineAction } from '#shared/request/action.ts';
import { HealthReport } from '../health.schema.ts';
import { buildReport, httpStatusFor } from '../health.service.ts';

// GET /health/ready - readiness. Checks only critical dependencies (the
// database): 200 when the service can serve traffic, 503 otherwise.
// Intended for deploy gating (multi-instance).
export default defineAction({
  openapi: {
    summary: 'Readiness probe',
    responses: {
      200: { description: 'Ready to serve traffic', schema: HealthReport },
      503: {
        description: 'Not ready - a critical dependency is down',
        schema: HealthReport,
      },
    },
  },
  async handler({ res }) {
    const report = await buildReport('ready');
    res
      .status(httpStatusFor(report.status))
      .type('application/health+json')
      .json(report);
  },
});
