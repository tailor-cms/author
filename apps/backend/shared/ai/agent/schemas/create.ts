// Wire shape for creating an agent session.
import { z } from 'zod';
import { AgentMode } from './entity.ts';

export const CreateInput = z
  .object({
    mode: z
      .enum(AgentMode)
      .optional()
      .describe('Autonomy level for the session; defaults to `EDIT`.'),
  })
  .describe('Optional mode selection for the new session.');

export type CreateInput = z.infer<typeof CreateInput>;
