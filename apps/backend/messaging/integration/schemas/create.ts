// Wire shape for registering an external integration.
import { MdiIcon, ShortText } from '#shared/request/schemas.ts';
import { Integration } from './entity.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const CreateIntegrationInput = z
  .object({
    key: ShortText(1, 60)
      .regex(/^[a-z0-9][a-z0-9_-]*$/)
      .describe(oneLine`
        Stable identifier, unique per repository. This is the key a
        thread subscribes to as \`integration:<key>\`, so it is
        lowercase and URL-safe rather than a display name.
      `),
    name: ShortText(1, 120).describe('Display name shown on its posts.'),
    icon: MdiIcon().optional(),
  })
  .describe(oneLine`
    Registers an external integration. Where it posts is a separate
    decision: a thread subscribes to \`integration:<key>\`.
  `);

export type CreateIntegrationInput = z.infer<typeof CreateIntegrationInput>;

export const CreateIntegrationResult = Integration.extend({
  token: z
    .string()
    .describe('Inbound webhook token. Returned once, never stored raw.'),
})
  .meta({ id: 'IntegrationCreateResult' })
  .describe('Newly registered integration, including its one-time token.');

export type CreateIntegrationResult = z.infer<typeof CreateIntegrationResult>;
