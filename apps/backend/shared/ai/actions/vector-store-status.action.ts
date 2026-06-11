import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../api-schemas/index.ts';
import AIService from '../ai.service.ts';

export default defineAction({
  name: 'getVectorStoreStatus',
  params: schemas.VectorStoreItemParams,
  openapi: {
    authenticated: true,
    summary: 'Get vector store status',
    responses: {
      200: {
        description: 'Vector store readiness + per-file processing state.',
        schema: dataEnvelope(schemas.VectorStoreStatus),
      },
    },
  },
  async handler({ params }) {
    return AIService.vectorStore.getStatus(params.vectorStoreId);
  },
});
