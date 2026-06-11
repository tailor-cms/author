import { defineAction, type Ctx } from '#shared/request/action.ts';
import type { AiContext } from '@tailor-cms/interfaces/ai.ts';
import { oneLine } from 'common-tags';
import AIService from '../ai.service.ts';
import * as schemas from '../api-schemas/index.ts';

async function handler({ body }: Ctx<{ body: typeof schemas.GenerateInput }>) {
  return AIService.generate(body as unknown as AiContext);
}

export default defineAction({
  name: 'generate',
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
