import { z } from 'zod';

import { IntParam } from '#shared/request/schemas.ts';

export const TypingInput = z
  .object({ threadId: IntParam().describe('Thread being typed in.') })
  .describe('Ephemeral typing signal; never persisted.');

export type TypingInput = z.infer<typeof TypingInput>;
