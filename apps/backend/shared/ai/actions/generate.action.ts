import type { AiContext } from '@tailor-cms/interfaces/ai.ts';
import * as schemas from '../api-schemas/index.ts';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { RepositoryScopedParams } from '#shared/request/schemas.ts';
import AIService from '../ai.service.ts';

async function handler({
  body,
  req,
}: Ctx<{
  params: typeof RepositoryScopedParams;
  body: typeof schemas.GenerateInput;
}>) {
  const { id, schema, name, description } = req.repository!;
  const context = {
    ...body,
    repository: {
      ...body.repository,
      repositoryId: id,
      schemaId: schema,
      name,
      description,
    },
  };
  return AIService.generate(context as unknown as AiContext);
}

export default defineAction({
  name: 'generate',
  params: RepositoryScopedParams,
  body: schemas.GenerateInput,
  openapi: {
    authenticated: true,
    summary: 'Generate AI content for a repository',
    responses: {
      200: {
        description: oneLine`
          Generated content. Shape varies per request - it matches the
          structured-output schema named in \`inputs[*].responseSchema\`.
        `,
      },
    },
  },
  handler,
});
