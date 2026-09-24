import * as schemas from '../schemas/index.ts';
import { defineAction } from '#shared/request/action.ts';

export default defineAction({
  name: 'cancelAgentRun',
  params: schemas.RunItemParams,
  openapi: {
    authenticated: true,
    summary: 'Stop run',
    description: 'The in-progress step will be stopped.',
    responses: {
      204: { description: 'Stop requested.' },
      403: { description: 'Run belongs to a different user.' },
      404: { description: 'Run not found or no longer kept.' },
    },
  },
  async handler({ req }) {
    req.agentRun!.cancel();
  },
});
