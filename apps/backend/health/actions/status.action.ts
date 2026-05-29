import { defineAction } from '#shared/request/action.ts';
import { HealthReport } from '../health.schema.ts';
import { buildReport, httpStatusFor } from '../health.service.ts';

// GET /health/status - deep diagnostics across every dependency. Admin-only
// (gated in the slice router like the other admin routes), since the report
// exposes latencies, infra hints, and error strings.
export default defineAction({
  openapi: {
    summary: 'Deep health diagnostics',
    authenticated: true,
    responses: {
      200: { description: 'Aggregate status pass/warn', schema: HealthReport },
      503: { description: 'A critical dependency is down', schema: HealthReport },
    },
  },
  async handler({ res }) {
    const report = await buildReport('full');
    res
      .status(httpStatusFor(report.status))
      .type('application/health+json')
      .json(report);
  },
});
