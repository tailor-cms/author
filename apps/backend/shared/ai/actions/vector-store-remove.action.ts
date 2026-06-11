import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../api-schemas/index.ts';
import AIService from '../ai.service.ts';

export default defineAction({
  name: 'deleteVectorStore',
  params: schemas.VectorStoreItemParams,
  openapi: {
    authenticated: true,
    summary: 'Delete a vector store',
    responses: { 204: { description: 'Vector store deleted.' } },
  },
  async handler({ params }) {
    await AIService.vectorStore.deleteStore(params.vectorStoreId);
  },
});
