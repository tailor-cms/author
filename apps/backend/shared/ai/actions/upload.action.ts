import { defineAction, type Ctx } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../api-schemas/index.ts';
import AIService from '../ai.service.ts';

async function handler({
  body,
  req,
}: Ctx<{ body: typeof schemas.UploadInput }>) {
  const files = (req as any).files ?? [];
  return AIService.vectorStore.upload(files, body.vectorStoreId);
}

export default defineAction({
  name: 'upload',
  body: schemas.UploadInput,
  multipart: schemas.UploadMultipart,
  openapi: {
    authenticated: true,
    summary: 'Upload PDFs to a vector store',
    responses: {
      200: {
        description: 'Vector store id + per-file upload metadata.',
        schema: dataEnvelope(schemas.UploadResult),
      },
    },
  },
  handler,
});
